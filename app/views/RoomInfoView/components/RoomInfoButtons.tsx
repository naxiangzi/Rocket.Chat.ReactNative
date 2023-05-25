import React from 'react';
import { Text, View } from 'react-native';
import { BorderlessButton } from 'react-native-gesture-handler';

import { CustomIcon, TIconsName } from '../../../containers/CustomIcon';
import i18n from '../../../i18n';
import { useAppSelector } from '../../../lib/hooks';
import { useVideoConf } from '../../../lib/hooks/useVideoConf';
import { compareServerVersion } from '../../../lib/methods/helpers';
import { useTheme } from '../../../theme';
import styles from '../styles';

function BaseButton({
	danger,
	iconName,
	onPress,
	label,
	showIcon = true
}: {
	danger?: boolean;
	iconName: TIconsName;
	onPress?: (prop: any) => void;
	label: string;
	showIcon?: boolean;
}): React.ReactElement | null {
	const { colors } = useTheme();
	const color = danger ? colors.dangerColor : colors.actionTintColor;

	if (showIcon)
		return (
			<BorderlessButton testID={`room-info-view-${iconName}`} onPress={onPress} style={styles.roomButton}>
				<CustomIcon name={iconName} size={30} color={color} />
				<Text style={[styles.roomButtonText, { color }]}>{label}</Text>
			</BorderlessButton>
		);
	return null;
}

function CallButton({ rid, isDirect }: { rid: string; isDirect: boolean }): React.ReactElement | null {
	const { showCallOption, showInitCallActionSheet } = useVideoConf(rid);
	const serverVersion = useAppSelector(state => state.server.version);
	const greaterThanFive = compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '5.0.0');

	const showIcon = greaterThanFive ? showCallOption : showCallOption && isDirect;

	return <BaseButton onPress={showInitCallActionSheet} iconName='phone' label={i18n.t('Call')} showIcon={showIcon} />;
}

export const RoomInfoButtons = ({
	room,
	roomFromRid,
	roomUser,
	isDirect,
	fromRid,
	handleCreateDirectMessage,
	handleIgnoreUser,
	handleBlockUser
}) => {
	// Following the web behavior, when is a DM with myself, shouldn't appear block or ignore option
	const isDmWithMyself = roomFromRid?.uids && roomFromRid.uids?.filter((uid: string) => uid !== roomUser._id).length === 0;

	const isFromDm = roomFromRid?.rid === roomUser._id;
	const isDirectFromSaved = isDirect && fromRid && roomFromRid;
	const isIgnored = roomFromRid?.ignored?.includes?.(roomUser._id);
	const isBlocked = roomFromRid?.blocker;

	const renderIgnoreUser = isDirectFromSaved && !isFromDm && !isDmWithMyself;
	const renderBlockUser = isDirectFromSaved && isFromDm;

	return (
		<View style={styles.roomButtonsContainer}>
			<BaseButton onPress={handleCreateDirectMessage} label={i18n.t('Message')} iconName='message' />
			<CallButton isDirect={isDirect} rid={room.rid} />
			<BaseButton
				onPress={handleIgnoreUser}
				label={i18n.t(isIgnored ? 'Unignore' : 'Ignore')}
				iconName='ignore'
				showIcon={renderIgnoreUser}
				danger
			/>
			<BaseButton
				onPress={handleBlockUser}
				label={i18n.t(`${isBlocked ? 'Unblock' : 'Block'}_user`)}
				iconName='ignore'
				showIcon={renderBlockUser}
				danger
			/>
		</View>
	);
};

export default RoomInfoButtons;

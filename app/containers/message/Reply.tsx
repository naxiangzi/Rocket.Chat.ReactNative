import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import moment from 'moment';
import { transparentize } from 'color2k';
import { dequal } from 'dequal';

import Touchable from './Touchable';
import Markdown from '../markdown';
import openLink from '../../utils/openLink';
import sharedStyles from '../../views/Styles';
import { themes } from '../../constants/colors';
import MessageContext from './Context';

const styles = StyleSheet.create({
	button: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 6,
		alignSelf: 'flex-start',
		borderWidth: 1,
		borderRadius: 4
	},
	attachmentContainer: {
		flex: 1,
		borderRadius: 4,
		flexDirection: 'column',
		padding: 15
	},
	authorContainer: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center'
	},
	author: {
		flex: 1,
		fontSize: 16,
		...sharedStyles.textMedium
	},
	time: {
		fontSize: 12,
		marginLeft: 10,
		...sharedStyles.textRegular,
		fontWeight: '300'
	},
	fieldsContainer: {
		flex: 1,
		flexWrap: 'wrap',
		flexDirection: 'row'
	},
	fieldContainer: {
		flexDirection: 'column',
		padding: 10
	},
	fieldTitle: {
		fontSize: 14,
		...sharedStyles.textSemibold
	},
	fieldValue: {
		fontSize: 14,
		...sharedStyles.textRegular
	},
	marginTop: {
		marginTop: 4
	},
	marginBottom: {
		marginBottom: 4
	}
});

interface IMessageReplyAttachment {
	author_name: string;
	message_link: string;
	ts: string;
	text: string;
	title: string;
	short: boolean;
	value: string;
	title_link: string;
	author_link: string;
	type: string;
	color: string;
	description: string;
	fields: IMessageReplyAttachment[];
}

interface IMessageTitle {
	attachment: Partial<IMessageReplyAttachment>
	timeFormat: string;
	theme: string;
}

interface IMessageDescription {
	attachment: Partial<IMessageReplyAttachment>
	getCustomEmoji: Function;
	theme: string;
}

interface IMessageFields {
	attachment: Partial<IMessageReplyAttachment>;
	theme: string;
	getCustomEmoji: Function;
}

interface IMessageReply {
	attachment: Partial<IMessageReplyAttachment>
	timeFormat: string;
	index: number;
	theme: string;
	getCustomEmoji: Function;
}

const Title = React.memo(({ attachment, timeFormat, theme }: IMessageTitle) => {
	if (!attachment.author_name) {
		return null;
	}
	const time = attachment.message_link && attachment.ts ? moment(attachment.ts).format(timeFormat) : null;
	return (
		<View style={styles.authorContainer}>
			{attachment.author_name ? <Text style={[styles.author, { color: themes[theme].bodyText }]}>{attachment.author_name}</Text> : null}
			{time ? <Text style={[styles.time, { color: themes[theme].auxiliaryText }]}>{ time }</Text> : null}
		</View>
	);
});

const Description = React.memo(({ attachment, getCustomEmoji, theme }: IMessageDescription) => {
	const text = attachment.text || attachment.title;
	if (!text) {
		return null;
	}
	const { baseUrl, user } = useContext(MessageContext);
	return (
		// @ts-ignore
		<Markdown
			msg={text}
			baseUrl={baseUrl}
			username={user.username}
			getCustomEmoji={getCustomEmoji}
			theme={theme}
		/>
	);
}, (prevProps, nextProps) => {
	if (prevProps.attachment.text !== nextProps.attachment.text) {
		return false;
	}
	if (prevProps.attachment.title !== nextProps.attachment.title) {
		return false;
	}
	if (prevProps.theme !== nextProps.theme) {
		return false;
	}
	return true;
});

const Fields = React.memo(({ attachment, theme, getCustomEmoji }: IMessageFields) => {
	if (!attachment.fields) {
		return null;
	}

	const { baseUrl, user } = useContext(MessageContext);
	return (
		<View style={styles.fieldsContainer}>
			{attachment.fields.map(field => (
				<View key={field.title} style={[styles.fieldContainer, { width: field.short ? '50%' : '100%' }]}>
					<Text style={[styles.fieldTitle, { color: themes[theme].bodyText }]}>{field.title}</Text>
					{/*@ts-ignore*/}
					<Markdown
						msg={field.value}
						baseUrl={baseUrl}
						username={user.username}
						getCustomEmoji={getCustomEmoji}
						theme={theme}
					/>
				</View>
			))}
		</View>
	);
}, (prevProps, nextProps) => dequal(prevProps.attachment.fields, nextProps.attachment.fields) && prevProps.theme === nextProps.theme);

const Reply = React.memo(({ attachment, timeFormat, index, getCustomEmoji, theme }: IMessageReply) => {
	if (!attachment) {
		return null;
	}
	const { baseUrl, user, jumpToMessage } = useContext(MessageContext);

	const onPress = () => {
		let url = attachment.title_link || attachment.author_link;
		if (attachment.message_link) {
			return jumpToMessage(attachment.message_link);
		}
		if (!url) {
			return;
		}
		if (attachment.type === 'file') {
			if (!url.startsWith('http')) {
				url = `${ baseUrl }${ url }`;
			}
			url = `${ url }?rc_uid=${ user.id }&rc_token=${ user.token }`;
		}
		openLink(url, theme);
	};

	let { borderColor, chatComponentBackground: backgroundColor } = themes[theme];
	try {
		if (attachment.color) {
			backgroundColor = transparentize(attachment.color, 0.80);
			borderColor = attachment.color;
		}
	} catch (e) {
		// fallback to default
	}

	return (
		<>
			<Touchable
				onPress={onPress}
				style={[
					styles.button,
					index > 0 && styles.marginTop,
					attachment.description && styles.marginBottom,
					{
						backgroundColor, borderColor
					}
				]}
				background={Touchable.Ripple(themes[theme].bannerBackground)}
			>
				<View style={styles.attachmentContainer}>
					<Title
						attachment={attachment}
						timeFormat={timeFormat}
						theme={theme}
					/>
					<Description
						attachment={attachment}
						getCustomEmoji={getCustomEmoji}
						theme={theme}
					/>
					<Fields
						attachment={attachment}
						getCustomEmoji={getCustomEmoji}
						theme={theme}
					/>
				</View>
			</Touchable>
			{/*@ts-ignore*/}
			<Markdown
				msg={attachment.description!}
				baseUrl={baseUrl}
				username={user.username}
				getCustomEmoji={getCustomEmoji}
				theme={theme}
			/>
		</>
	);
}, (prevProps, nextProps) => dequal(prevProps.attachment, nextProps.attachment) && prevProps.theme === nextProps.theme);

Reply.displayName = 'MessageReply';
Title.displayName = 'MessageReplyTitle';
Description.displayName = 'MessageReplyDescription';
Fields.displayName = 'MessageReplyFields';

export default Reply;
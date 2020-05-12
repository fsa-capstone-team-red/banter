import React, { Component } from 'react';
import { StyleSheet, View } from 'react-native';
import { GiftedChat } from 'react-native-gifted-chat';
import { connect } from 'react-redux';

import Fire, { auth, db } from '../Firebase';
import Layout from '../constants/Layout';
import { fetchMessages, postMessage, subscribeToMessages } from '../store/messages';
class SingleChat extends Component {
	constructor(props) {
		super(props);
		this.state = {
			messages: [],
			user: {
				_id: '',
				name: ''
			},
			chatId: ''
		};
		this.handleSendMessage = this.handleSendMessage.bind(this);
	}

	// componentWillMount() {
	// 	this.props.subscribeToMessages();
	// }

	async componentDidMount() {
		// Fire.shared.on(message =>
		// 	this.setState(previousState => ({
		// 		messages: GiftedChat.append(previousState.messages, message)
		// 	}))
		// );
		console.log('THIS.PROPS START SINGLECHAT', this.props);
		const user = auth.currentUser;
		await this.props.fetchMessages();
		console.log('THIS.PROPS AFTER FETCHMSGS', this.props);
		console.log('SINGLE CHAT currentChatId: ', this.props.currentChat);
		const chatId = this.props.currentChat.currentChatId;
		this.setState({
			chatId,
			messages: this.props.messages,
			user: { _id: user.uid, name: user.displayName }
		});
	}

	handleSendMessage(messages) {
		console.log('HANDLE SEND MSG: ', messages);
		this.setState(previousState => ({
			messages: GiftedChat.append(previousState.messages, messages)
		}));
		const { uid, displayName } = auth.currentUser;
		const { contactId } = this.props.route.params;
		const message = messages[messages.length - 1].text;
		const timestamp = Date.now();
		this.props.sendMessage({ uid, displayName, contactId, message, timestamp });
	}

	render() {
		console.log('*******THIS STATE*******', this.state);

		return (
			<View style={styles.container}>
				<GiftedChat
					messages={this.state.messages}
					user={this.state.user}
					onSend={this.handleSendMessage}
					alignTop={true}
					isTyping={true}
					showUserAvatar={true}
					showAvatarForEveryMessage={true}
					placeholder='Type a message...'
				/>
			</View>
		);
	}
}

const mapState = state => ({
	currentChat: state.chats.currentChat,
	messages: state.messages.currentChatMessages
});

const mapDispatch = dispatch => ({
	fetchMessages: () => dispatch(fetchMessages()),
	sendMessage: msg => dispatch(postMessage(msg))
	// subscribeToMessages: () => dispatch(subscribeToMessages())
});

export default connect(mapState, mapDispatch)(SingleChat);

const styles = StyleSheet.create({
	container: {
		backgroundColor: '#fafafa',
		width: Layout.window.width,
		height: Layout.window.height * 0.9
	},
	headerContainer: {
		flexDirection: 'row',
		backgroundColor: '#fafafa',
		paddingLeft: 16,
		paddingRight: 16,
		paddingTop: 4,
		paddingBottom: 4
	}
});

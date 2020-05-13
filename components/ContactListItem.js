import React from 'react';
import { Image, Platform, StyleSheet, Text, TouchableHighlight, View, FlatList } from 'react-native';

const ContactListItem = props => {
	console.log('PROPS', props);

	const goToSingleChat = contact => {
		props.fetchCurrentChatId(contact.id);
		props.navigation.navigate('SingleChat', {
			id: contact.id,
			name: contact.name
		});
	};

	return (
		<TouchableHighlight onPress={() => goToSingleChat(props)}>
			<View style={styles.container}>
				{props.imageUrl && <Image source={{ uri: props.imageUrl }} style={styles.image} />}
				<View style={styles.contactWrapper}>
					<View style={styles.contactNameWrapper}>
						<Text style={styles.contactName}>{props.name}</Text>
					</View>
					<View style={styles.contactInfoWrapper}>
						<Text style={styles.contactWrapper}>{props.phone}</Text>
					</View>
					<View style={styles.contactInfoWrapper}>
						<Text style={styles.contactWrapper}>{props.email}</Text>
					</View>
				</View>
			</View>
		</TouchableHighlight>
	);
};

export default ContactListItem;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
		flexDirection: 'row',
		padding: 15,
		borderBottomWidth: 1,
		borderColor: '#b7b7b7'
	},
	image: {
		width: 50,
		height: 50,
		borderRadius: 50
	},
	contactNameWrapper: {
		marginLeft: 10
	},
	contactWrapper: {
		marginLeft: 10
	},
	contactName: {
		fontSize: 23,
		fontWeight: 'bold'
	},
	contactInfoWrapper: {
		marginTop: 5
	},
	contactInfo: {
		fontSize: 13
	}
});

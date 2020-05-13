import * as React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AddContactScreen, ContactsScreen } from '../screens';
import { ContactsHeaderRight } from '../components';

const Stack = createStackNavigator();

export default function ContactNavigator({ navigation, route }) {
	console.log('STACK PROPS', navigation);
	return (
		<Stack.Navigator navigation={navigation} initialRouteName='Contact'>
			<Stack.Screen
				name='Contact'
				component={ContactsScreen}
				options={({ navigation }) => ({
					title: 'Contacts',
					headerRight: () => <ContactsHeaderRight navigation={navigation} />
				})}
			/>
			<Stack.Screen
				name='AddContact'
				component={AddContactScreen}
				options={{
					title: 'Add Contact'
				}}
			/>
		</Stack.Navigator>
	);
}

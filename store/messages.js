import {db} from '../Firebase'
import {createCurrentChatId, addNewMembers} from './chats'
import {addNewChatroom} from './user'
import {getLangValue, getLangKey} from '../utils/translate'
import {GOOGLE_API_KEY} from 'react-native-dotenv'

const chatsRef = db.ref('chats')

// ---------- ACTION TYPES ---------- //
export const GET_MESSAGES = 'GET_MESSAGES'
export const ADD_MESSAGE = 'ADD_MESSAGE'
const SEND_MESSAGE_ERROR = 'SEND_MESSAGE_ERROR'

// ---------- ACTION CREATORS ---------- //

export const getMessages = (messages) => ({type: GET_MESSAGES, messages})
const addMessage = (message) => ({type: ADD_MESSAGE, message})
// const sendMessageError = (message) => ({ type: ADD_CONTACT_ERROR, message });

// ---------- THUNK CREATORS ---------- //

// GET MESSAGES FOR CURRENT CHAT
export const fetchMessages = () => (dispatch, getState) => {
  // query for all messages for the current chat, and add listener on child_added for new messages
  if (getState().chats.currentChat) {
    // console.log('FETCH MESSAGES', getState().chats.currentChat.id)
    db.ref(`messages/${getState().chats.currentChat.id}`).on(
      'child_added',
      function (snapshot) {
        // format a message object compatible with GiftedChat, message text not added yet
        const newMessage = {
          _id: snapshot.key,
          user: {
            _id: snapshot.val().senderId,
            name: snapshot.val().senderName,
          },
          createdAt: snapshot.val().timestamp,
          original: snapshot.val().translations.original,
        }

        const userLanguage = getState().user.language

        // if the message was sent by the user it will not be translated
        if (snapshot.val().senderId !== getState().firebase.auth.uid) {
          // check if translation to user's language exists
          if (snapshot.val().translations[userLanguage]) {
            newMessage.text = snapshot.val().translations[userLanguage]
            newMessage.translatedFrom =
              snapshot.val().translations[userLanguage] !==
              snapshot.val().message
                ? snapshot.val().detectedSource
                : false
            dispatch(addMessage(newMessage))
          } else {
            // translate the original message to the language of the user
            fetch(
              `https://translation.googleapis.com/language/translate/v2?q=${
                snapshot.val().message
              }&target=${getLangKey(userLanguage)}&key=${GOOGLE_API_KEY}`
            )
              .then((response) => {
                return response.json()
              })
              .then((data) => {
                // add the translation to the db
                db.ref(
                  `messages/${getState().chats.currentChat.id}/${
                    snapshot.key
                  }/translations`
                ).update({
                  [userLanguage]: data.data.translations[0].translatedText,
                })

                // update detected source language if it does not exist
                if (!snapshot.val().detectedSource) {
                  db.ref(
                    `messages/${getState().chats.currentChat.id}/${
                      snapshot.key
                    }`
                  ).update({
                    detectedSource: getLangValue(
                      data.data.translations[0].detectedSourceLanguage
                    ),
                  })
                }

                // add the translation to the new message
                newMessage.text = data.data.translations[0].translatedText
                newMessage.translatedFrom =
                  data.data.translations[0].translatedText !==
                  snapshot.val().message
                    ? getLangValue(
                        data.data.translations[0].detectedSourceLanguage
                      )
                    : false

                dispatch(addMessage(newMessage))
              })
          }
        } else {
          newMessage.text = snapshot.val().translations.original
          dispatch(addMessage(newMessage))
        }
      }
    )
  }
}

// SEND NEW MESSAGE
export const postMessage = (text) => async (dispatch, getState) => {
  try {
    const {uid, displayName, contacts, currChatId, message, timestamp} = text

    const members = getState().chats.currentChat.members
    members[uid] = displayName

    let chatId = currChatId
    // if chatId doesn't exist, create id, new chatroom and add members
    if (!chatId) {
      chatId = await dispatch(createCurrentChatId())
      await dispatch(addNewChatroom(chatId, uid))
      contacts.forEach(
        async (contact) =>
          await dispatch(addNewChatroom(chatId, contact.contactId))
      )
      await dispatch(addNewMembers(chatId, members))
    }

    // update chats node
    chatsRef
      .child(chatId)
      .update({
        lastMessage: message,
        senderId: uid,
        timestamp,
      })
      .then(() => {
        // update messages node
        db.ref(`messages/${chatId}`)
          .push()
          .set({
            message,
            senderId: uid,
            senderName: displayName,
            timestamp,
            translations: {
              original: message,
            },
          })
        contacts.forEach(async (contact) =>
          dispatch(notify(contact.contactId, displayName, message))
        )
      })
      .catch((err) =>
        console.log('Error posting message to chats and messages', err)
      )
  } catch (err) {
    console.error('Error adding msg to db: ', err)
  }
}

export const notify = (contactId, senderName, message) => async () => {
  try {
    const snapshot = await db
      .ref('/users/' + contactId + '/notifications/token')
      .once('value')

    const receiverToken = snapshot.val()

    if (receiverToken) {
      const notification = {
        to: receiverToken,
        sound: 'default',
        title: senderName,
        body: message,
        _displayInForeground: true,
      }
      fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notification),
      })
    }
  } catch (err) {
    console.error('Error sending notification: ', err)
  }
}
// ---------- INITIAL STATE ---------- //

const defaultMessages = {
  messages: [],
  sendMessageError: '',
}

// ---------- REDUCER ---------- //
const messagesReducer = (state = defaultMessages, action) => {
  switch (action.type) {
    case GET_MESSAGES:
      return {...state, messages: action.messages}
    case ADD_MESSAGE:
      // eslint-disable-next-line no-case-declarations
      let insertIndex = -1
      for (let i = 0; i < state.messages.length; i++) {
        if (state.messages[i].createdAt > action.message.createdAt) {
          insertIndex = i
          break
        }
      }
      if (insertIndex !== -1) {
        return {
          ...state,
          messages: state.messages
            .slice(0, insertIndex)
            .concat(action.message)
            .concat(state.messages.slice(insertIndex)),
        }
      } else {
        return {
          ...state,
          messages: state.messages.concat(action.message),
        }
      }
    case SEND_MESSAGE_ERROR:
      return {...state, sendMessageError: action.message}
    default:
      return state
  }
}

export default messagesReducer

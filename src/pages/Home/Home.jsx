import Navbar from "../../components/Navbar.jsx";
import {IoMdPersonAdd} from "react-icons/io";
import {addFriend, auth, getAllUsers, getUserNameById, db, sendMsg, useChat, createChat} from "../../firebase.js";
import {useEffect, useState} from "react";
import {toast} from "react-toastify";
import {onAuthStateChanged} from "firebase/auth";
import {getDoc, doc, updateDoc, onSnapshot} from "firebase/firestore";
import {RiKakaoTalkFill} from "react-icons/ri";

const Home = () => {

    const [friends, setFriends] = useState([])
    const [users, setUsers] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [openChatUserId, setOpenChatUserId] = useState(null);
    const [newMessage, setNewMessage] = useState("");
    const [localMessages, setLocalMessages] = useState([]);
    const [notifications, setNotifications] = useState({});
    const [lastSeenMessages, setLastSeenMessages] = useState({});
    const [chatUserName, setChatUserName] = useState("");


    const isFriend = (friends, userId) => {
        return friends.some(friend => friend.uid === userId)
    }


    useEffect(() => {
        const fetchFriends = async () => {
            if (currentUser) {
                const userRef = doc(db, "user", currentUser.uid)
                const userDoc = await getDoc(userRef)

                if (userDoc.exists() && userDoc.data().friends) {
                    setFriends(userDoc.data().friends)
                }
            }
        };
        fetchFriends()
    }, [currentUser]);


    useEffect(() => {
        const fetchChatUserName = async () => {
            if (openChatUserId) {
                const name = await getUserNameById(openChatUserId);
                setChatUserName(name);
            }
        };

        fetchChatUserName();
    }, [openChatUserId]);


    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user);

                // Récupérer les notifications depuis Firestore
                const userRef = doc(db, "user", user.uid);
                const unsubscribeNotifications = onSnapshot(userRef, (doc) => {
                    if (doc.exists()) {
                        const userData = doc.data();
                        console.log("Notifications mises à jour en temps réel :", userData.notifications);
                        setNotifications(userData.notifications || {});
                    }
                });

                return () => unsubscribeNotifications();
            } else {
                setCurrentUser(null);
                setNotifications({});
            }
        });

        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        const fetchUsers = async () => {
            const userList = await getAllUsers();
            if (currentUser) {
                const filteredUsers = userList.filter(user => user.uid !== currentUser.uid)
                setUsers(filteredUsers)
                const initialNotifications = {};
                filteredUsers.forEach(user => {
                    initialNotifications[user.uid] = 0;
                })
                setNotifications(initialNotifications)
            } else {
                setUsers(userList)
            }
        };
        fetchUsers();
    }, [currentUser]);

    const handleOpenChat = async (userId) => {
        if (!currentUser) return;

        await createChat(currentUser.uid, userId);

        const chatId = [currentUser.uid, userId].sort().join("_");
        const chatRef = doc(db, "chats", chatId);
        const chatDoc = await getDoc(chatRef);

        if (chatDoc.exists()) {
            const messages = chatDoc.data().messages;
            const lastMessage = messages[messages.length - 1];

            if (lastMessage) {
                const updatedLastSeenMessages = {
                    ...lastSeenMessages,
                    [userId]: lastMessage.timestamp,
                };
                setLastSeenMessages(updatedLastSeenMessages);

                // Mettre à jour lastSeenMessages dans Firestore
                const userRef = doc(db, "user", currentUser.uid);
                await updateDoc(userRef, {
                    lastSeenMessages: updatedLastSeenMessages,
                });
            }
        }

        const userRef = doc(db, "user", currentUser.uid)
        const userDoc = await getDoc(userRef)

        if (userDoc.exists()) {
            const userData = userDoc.data();
            const updateNotifications = {...userData.notifications};
            delete updateNotifications[userId];

            await updateDoc(userRef, {
                notifications: updateNotifications,
            });

            setNotifications(updateNotifications)
        }
        setOpenChatUserId(userId);
    };

    const handleAddFriend = async (friendUid, friendName) => {
        // Vérifiez que l'utilisateur est connecté
        if (!currentUser) {
            toast.error("Aucun utilisateur connecté");
            return;
        }

        // Vérifiez que les arguments sont valides
        if (!friendUid || !friendName) {
            toast.error("Informations de l'ami manquantes");
            return;
        }

        try {
            // Appelez la fonction addFriend avec les arguments corrects
            await addFriend(currentUser.uid, friendUid, friendName);
            toast.success(`${friendName} a été ajouté à vos amis ! Vous pouvez maintenant discuter !`);
            setFriends(prevFriends => [
                ...prevFriends,
                {uid: friendUid, name: friendName}
            ])
        } catch (e) {
            // Affichez un message d'erreur détaillé
            toast.error("Impossible d'ajouter cet ami.");
            console.error("Erreur détaillée :", e);

            // Si vous voulez afficher un message plus spécifique à l'utilisateur
            if (e.message) {
                toast.error(`Erreur : ${e.message}`);
            }
        }
    };
    

    const handleSendMessage = async () => {
        if (newMessage.trim() === "") return;

        const newMsg = {
            sender: currentUser.uid,
            text: newMessage,
            timestamp: Date.now(),
        }
        setLocalMessages((prev) => [...prev, newMsg])

        const chatId = [currentUser.uid, openChatUserId].sort().join("_")
        await sendMsg(chatId, currentUser.uid, newMessage)

        const receiveRef = doc(db, "user", openChatUserId)
        const receiverDoc = await getDoc(receiveRef)

        if (receiverDoc.exists()) {
            const receiverData = receiverDoc.data();
            const receiverNotifications = receiverData.notifications || {};

            receiverNotifications[currentUser.uid] = (receiverNotifications[currentUser.uid] || 0) + 1;

            await updateDoc(receiveRef, {
                notifications: receiverNotifications,
            });
        }
        setNewMessage("")
    };

    const messages = useChat([currentUser?.uid, openChatUserId].sort().join("_"))

    useEffect(() => {
        setLocalMessages(messages)
    }, [messages]);


    return (
        <div className="home min-h-screen bg-gray-100">
            <Navbar/>
            <div className="flex flex-col items-center p-8">
                {/* Section: Utilisateurs en ligne */}
                <div className="w-full max-w-lg bg-white/70 p-6 rounded-lg shadow-lg">
                    <h2 className="text-2xl font-semibold text-center text-gray-800 mb-4">
                        Utilisateurs de TCHAT !
                    </h2>
                    <ul className="space-y-4">
                        {users.length > 0 ? (
                            users.map((user) => (
                                <li
                                    key={user.uid}
                                    className="flex justify-between items-center py-2 border-b border-gray-300"
                                >
                                    <span className="text-gray-700">{user.name}</span>
                                    <div className="flex items-center">
                                        {notifications[user.uid] > 0 && (
                                            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 mr-2">
                                                {notifications[user.uid]}
                                            </span>
                                        )}
                                        {isFriend(friends, user.uid) ? (
                                            <button
                                                onClick={() => handleOpenChat(user.uid)}
                                                className="cursor-pointer border grey rounded-full p-2 hover:text-gray-700 hover:bg-gray-300"
                                            >
                                                <RiKakaoTalkFill/>
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleAddFriend(user.uid, user.name)}
                                                className="cursor-pointer border grey rounded-full p-2 hover:text-gray-700 hover:bg-gray-300"
                                            >
                                                <IoMdPersonAdd/>
                                            </button>
                                        )}
                                    </div>
                                </li>
                            ))
                        ) : (
                            <li className="text-center text-gray-500">Aucun utilisateur</li>
                        )}
                    </ul>
                </div>

                {/* Fenêtre de chat */}
                {openChatUserId && (
                    <div
                        className="mr-9 fixed bottom-0 right-0 w-96 h-96 bg-white shadow-lg rounded-t-lg overflow-hidden flex flex-col">
                        {/* En-tête du chat */}
                        <div className="p-4 bg-blue-600/80 text-white flex justify-between items-center">
                            <h2 className="text-lg font-semibold">Chat avec {chatUserName.toUpperCase()}</h2>
                            <button
                                onClick={() => setOpenChatUserId(null)}
                                className="text-white hover:text-gray-200"
                            >
                                &times;
                            </button>
                        </div>

                        {/* Liste des messages */}
                        <div className="flex-1 p-4 overflow-y-auto">
                            {messages.map((msg, index) => (
                                <div
                                    key={index}
                                    className={`message ${
                                        msg.sender === currentUser.uid ? "text-right" : "text-left"
                                    }`}
                                >
                                    <p
                                        className={`inline-block p-2 rounded-lg ${
                                            msg.sender === currentUser.uid
                                                ? "bg-blue-500 text-white mt-2"
                                                : "bg-gray-200 text-gray-800 mt-2"
                                        }`}
                                    >
                                        {msg.text}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Champ de saisie */}
                        <div className="p-4 border-t border-gray-200">
                            <div className="flex">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Tapez un message..."
                                    className="flex-1 p-2 border border-gray-300 rounded-l-lg focus:outline-none"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    className="px-4 bg-blue-600/80 text-white rounded-r-lg hover:bg-blue-700"
                                >
                                    Envoyer
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;

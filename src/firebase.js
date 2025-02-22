import {initializeApp} from "firebase/app";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile
} from 'firebase/auth'
import {
    getFirestore,
    onSnapshot,
    getDoc,
    setDoc,
    collection,
    getDocs,
    doc,
    arrayUnion,
    updateDoc
} from 'firebase/firestore'
import {toast} from "react-toastify";
import {useEffect, useState} from "react";


const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app)
const db = getFirestore(app)

const signup = async (name, email, password) => {
    try {
        const res = await createUserWithEmailAndPassword(auth, email, password)
        const user = res.user
        await updateProfile(user, {displayName: name})
        await setDoc(doc(db, "user", user.uid), {
            uid: user.uid,
            name,
            authProvider: "local",
            email,
            friends: []
        });
        return user;
    } catch (e) {
        console.error(e)
        toast.error(e.code.split('/')[1].split('-').join(""))
        throw e;
    }
}

const login = async (email, password) => {
    try {
        const res = await signInWithEmailAndPassword(auth, email, password)
        return res.user
    } catch (e) {
        console.log(e)
        toast.error(e.code.split('/')[1].split('-').join(""))
        throw e;
    }
}

const logout = () => {
    signOut(auth)
}

const addFriend = async (userId, friendUid, friendName) => {
    try {
        const currentUser = auth.currentUser;
        console.log("Ajout d'un ami :", {userId, friendUid, friendName}); // Log pour déboguer

        const userRef = doc(db, "user", userId);
        const userDoc = await getDoc(userRef); // Vérifiez si le document existe

        if (!userDoc.exists()) {
            throw new Error("Document utilisateur introuvable");
        }

        // Vérifiez que le champ `friends` existe
        if (!userDoc.data().friends) {
            await updateDoc(userRef, {
                friends: [] // Initialisez le tableau `friends` s'il n'existe pas
            });
        }

        // Ajoutez l'ami à la liste des amis
        await updateDoc(userRef, {
            friends: arrayUnion({uid: friendUid, name: friendName})
        });

        console.log(`${friendName} ajouté aux amis de ${userId}`);

        const friendRef = doc(db, "user", friendUid)
        const friendDoc = await getDoc(friendRef)

        if (!friendDoc.exists()) {
            throw new Error("Document ami introuvable")
        }

        if (!friendDoc.data().friends) {
            await updateDoc(friendRef, {
                friends: []
            })
        }

        await updateDoc(friendRef, {
            friends: arrayUnion({uid: userId, name: currentUser.displayName})
        });
        console.log(`${currentUser.displayName} ajouté aux amis`)
    } catch (e) {
        console.error("Erreur lors de l'ajout de l'ami :", e);
        throw e; // Propager l'erreur pour la gérer dans le composant
    }
};


const getAllUsers = async () => {
    try {
        const usersCollection = collection(db, "user"); // Référence à la collection `user`
        const usersSnapshot = await getDocs(usersCollection); // Récupère tous les documents

        const usersList = usersSnapshot.docs.map(doc => ({
            uid: doc.id, // ID du document
            name: doc.data().name // Nom de l'utilisateur
        }));

        return usersList;
    } catch (e) {
        console.error("Erreur lors de la récupération des utilisateurs : ", e);
        return [];
    }
};

const getUserNameById = async (userId) => {
    try {
        const userRef = doc(db, "user", userId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            return userDoc.data().name; // Retourne le nom de l'utilisateur
        } else {
            return "Utilisateur inconnu"; // Retourne une valeur par défaut si l'utilisateur n'existe pas
        }
    } catch (e) {
        console.error("Erreur lors de la récupération du nom de l'utilisateur :", e);
        return "Utilisateur inconnu";
    }
};

const createChat = async (user1, user2) => {
    const chatId = [user1, user2].sort().join("_")
    const chatRef = doc(db, "chats", chatId)

    const chatDoc = await getDoc(chatRef);
    if (!chatDoc.exists()) {
        await setDoc(chatRef, {
            user1: user1,
            user2: user2,
            messages: [],
        })
    }
}

const sendMsg = async (chatId, sender, text) => {
    const chatRef = doc(db, "chats", chatId)
    await updateDoc(chatRef, {
        messages: arrayUnion({
            sender: sender,
            text: text,
            timestamp: Date.now(),
        })
    })
}

const useChat = (chatId) => {
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        const chatRef = doc(db, "chats", chatId);
        const unsubscribe = onSnapshot(chatRef, (doc) => {
            if (doc.exists()) {
                setMessages(doc.data().messages);
            }
        });
        return () => unsubscribe();
    }, [chatId]);

    return messages;
};

export {auth, db, login, signup, logout, getAllUsers, getUserNameById, addFriend, createChat, sendMsg, useChat}
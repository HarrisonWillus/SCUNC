import { initializeApp } from "firebase/app";
import { getFirestore, getDocs, collection } from "firebase/firestore";
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyBw1BEdh09DKqA8GyHGr7pbXVk2aKhZOsM",
    authDomain: "scunc-6c4ff.firebaseapp.com",
    projectId: "scunc-6c4ff",
    storageBucket: "scunc-6c4ff.firebasestorage.app",
    messagingSenderId: "927213628701",
    appId: "1:927213628701:web:46daf93df2a526f4f105f4",
    measurementId: "G-J679NRGENC"
}; 

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage, app, getDocs, collection };

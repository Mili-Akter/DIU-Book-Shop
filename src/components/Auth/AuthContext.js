import {
  applyActionCode,
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  FacebookAuthProvider,
  getIdToken,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../../firebaseConfig';

const AuthContext = createContext({
  currentUser: null,
  loggedInUser: null,
  setCurrentUser: () => {},
  signInWithGoogle: () => Promise,
  signInWithFacebook: () => Promise,
  login: () => Promise,
  register: () => Promise,
  logout: () => Promise,
  forgotPassword: () => Promise,
  resetPassword: () => Promise,
  verifyEmail: () => Promise,
  setJWTToken: () => Promise,
  setAdminJWTToken: () => Promise,
  getDecodedUser: () => {},
});

export const useAuth = () => useContext(AuthContext);

export default function AuthContextProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loggedInUser, setLoggedInUser] = useState(null);

  // set current user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user ? user : null);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // get current user from database
  useEffect(() => {
    if (currentUser) {
      const unsubscribe = onSnapshot(
        doc(db, 'users', currentUser.email),
        (doc) => {
          setLoggedInUser(doc.data());
        }
      );
      return () => {
        unsubscribe();
      };
    }
  }, [currentUser]);

  // registration method
  async function register(name, phone, email, password) {
    await createUserWithEmailAndPassword(auth, email, password);

    // update profile
    await updateProfile(auth.currentUser, {
      displayName: name,
      photoURL: 'https://i.ibb.co/1Ks65g5/avatar.png',
    });

    // add user info on database
    const userRef = doc(db, 'users', email);

    const payload = {
      uid: auth.currentUser.uid,
      displayName: name,
      email,
      phone,
      photoURL: 'https://i.ibb.co/1Ks65g5/avatar.png',
      accountCreated: auth.currentUser.metadata.creationTime,
      description: null,
      address: null,
      dob: null,
      userType: 'user',
      isVerified: false,
      timestamp: serverTimestamp(),
    };

    // store user info on database
    await setDoc(userRef, payload, { merge: true });

    sendEmailVerification(auth.currentUser).then(() => {
      // Email verification sent!
    });

    return payload;
  }

  // login method
  async function login(email, password) {
    await signInWithEmailAndPassword(auth, email, password);

    const userRef = doc(db, 'users', email);
    const docSnap = await getDoc(userRef);

    // check the user database
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  }

  // google sign in method
  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    const userCredentials = await signInWithPopup(auth, provider);

    const userRef = doc(db, 'users', userCredentials.user.email);
    const docSnap = await getDoc(userRef);

    // check the user database
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      // update profile
      await updateProfile(auth.currentUser, {
        displayName: userCredentials.user.displayName,
        photoURL: 'https://i.ibb.co/1Ks65g5/avatar.png',
      });

      // add user info on database
      const payload = {
        uid: auth.currentUser.uid,
        displayName: userCredentials.user.displayName,
        email: userCredentials.user.email,
        phone: null,
        photoURL: 'https://i.ibb.co/1Ks65g5/avatar.png',
        accountCreated: auth.currentUser.metadata.creationTime,
        description: null,
        address: null,
        dob: null,
        userType: 'user',
        isVerified: false,
        timestamp: serverTimestamp(),
      };

      // store user info on database
      await setDoc(userRef, payload, { merge: true });

      return payload;
    }
  }

  // facebook sign in method
  async function signInWithFacebook() {
    const provider = new FacebookAuthProvider();
    const userCredentials = await signInWithPopup(auth, provider);

    const userRef = doc(db, 'users', userCredentials.user.email);
    const docSnap = await getDoc(userRef);

    // check the user database
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      // update profile
      await updateProfile(auth.currentUser, {
        displayName: userCredentials.user.displayName,
        photoURL: 'https://i.ibb.co/1Ks65g5/avatar.png',
      });

      // add user info on database
      const payload = {
        uid: auth.currentUser.uid,
        displayName: userCredentials.user.displayName,
        email: userCredentials.user.email,
        phone: null,
        photoURL: 'https://i.ibb.co/1Ks65g5/avatar.png',
        accountCreated: auth.currentUser.metadata.creationTime,
        description: null,
        address: null,
        dob: null,
        userType: 'user',
        isVerified: false,
        timestamp: serverTimestamp(),
      };

      // store user info on database
      await setDoc(userRef, payload, { merge: true });

      sendEmailVerification(auth.currentUser).then(() => {
        // Email verification sent!
      });

      return payload;
    }
  }

  // forget password method
  function forgotPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  // reset password method
  function resetPassword(oobCode, newPassword) {
    return confirmPasswordReset(auth, oobCode, newPassword);
  }

  // verify email method
  function verifyEmail(oobCode) {
    return applyActionCode(auth, oobCode);
  }

  // set jwt token
  function setJWTToken() {
    getIdToken(auth.currentUser, true).then((idToken) => {
      localStorage.setItem('token', idToken);
    });
  }

  // // decode jwt token
  // function getDecodedUser() {
  //   const token = localStorage.getItem('token');
  //   if (!token) {
  //     return {};
  //   }

  //   const { name, picture, email } = jwt_decode(token);
  //   const decodedUser = {
  //     isSignedIn: true,
  //     name: name,
  //     email: email,
  //     photo: picture || 'https://i.ibb.co/1Ks65g5/avatar.png',
  //   };

  //   return decodedUser;
  // }

  // login method
  function logout() {
    setLoggedInUser(null);
    localStorage.removeItem('token');
    return signOut(auth);
  }

  const value = {
    currentUser,
    setCurrentUser,
    loggedInUser,
    signInWithGoogle,
    signInWithFacebook,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    verifyEmail,
    setJWTToken,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

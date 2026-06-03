import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const setupRecaptcha = (containerId: string) => {
  if ((window as any).recaptchaVerifier) {
    try {
      (window as any).recaptchaVerifier.clear();
    } catch (e) {
      console.error(e);
    }
    (window as any).recaptchaVerifier = null;
  }
  
  // We attach it to body so React doesn't remove it during re-renders.
  let element = document.getElementById('global-recaptcha');
  if (!element) {
    element = document.createElement('div');
    element.id = 'global-recaptcha';
    document.body.appendChild(element);
  } else {
    element.innerHTML = ''; // clear any old iframe
  }

  (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'global-recaptcha', {
    size: "invisible",
  });
};

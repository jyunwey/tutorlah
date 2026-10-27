import { onMounted, onUnmounted, ref } from "vue";
import { doc, getDoc } from "firebase/firestore";

import { db } from "../firebase.js";
import { observeCurrentUser } from "../services/auth.js";

export function useCurrentAccount() {
  const user = ref(null);
  const account = ref(null);
  const isLoading = ref(true);
  const errorMessage = ref("");

  let unsubscribe;
  let requestId = 0;

  onMounted(() => {
    unsubscribe = observeCurrentUser(async (currentUser) => {
      const currentRequest = ++requestId;
      user.value = currentUser;
      account.value = null;
      errorMessage.value = "";
      isLoading.value = true;

      if (!currentUser) {
        isLoading.value = false;
        return;
      }

      try {
        const snapshot = await getDoc(doc(db, "users", currentUser.uid));
        if (currentRequest !== requestId) return;

        if (snapshot.exists()) {
          account.value = { id: snapshot.id, ...snapshot.data() };
        } else {
          errorMessage.value = "Your account details could not be found.";
        }
      } catch (error) {
        if (currentRequest !== requestId) return;
        console.error("Could not load account:", error);
        errorMessage.value =
          "We could not load your account. Please refresh and try again.";
      } finally {
        if (currentRequest === requestId) isLoading.value = false;
      }
    });
  });

  onUnmounted(() => {
    requestId++;
    unsubscribe?.();
  });

  return { user, account, isLoading, errorMessage };
}

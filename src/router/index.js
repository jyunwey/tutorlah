import RegisterView from
  "../views/RegisterView.vue";
import FindTutorsView from
  "../views/FindTutorsView.vue";
import HomeView from
  "../views/HomeView.vue";
import PostAssignmentView from
  "../views/PostAssignmentView.vue";
import ProfileView from
  "../views/ProfileView.vue";
import TutorProfileView from
  "../views/TutorProfileView.vue";
import FindAssignmentsView from
  "../views/FindAssignmentsView.vue";
import CreateProfileView from
  "../views/CreateProfileView.vue";
import MyMatchesView from
  "../views/MyMatchesView.vue";
import LoginView from "../views/LoginView.vue";
import ForgotPasswordView from "../views/ForgotPasswordView.vue";
import AccountLoadErrorView from "../views/AccountLoadErrorView.vue";

import { createRouter, createWebHistory } from 'vue-router'
import { getCurrentAccount } from "../services/session.js";
import { auth } from "../firebase.js";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0 };
  },
  routes: [
    // FR-001: the app starts on the Login page. Signed-in users are sent
    // on to Home by the guestOnly check below.
    {
      path: "/",
      redirect: "/login",
    },
    {
      path: "/register",
      name: "register",
      component: RegisterView,
      meta: { title: "Sign Up", guestOnly: true },
    },
    {
      path: "/home",
      name: "home",
      component: HomeView,
      meta: { title: "Home", requiresAuth: true },
    },
    {
      path: "/post-assignment",
      name: "post-assignment",
      component: PostAssignmentView,
      meta: {
        title: "Post Assignment",
        roles: ["student"],
        requiresAuth: true
      },
    },
    {
      path: "/find-tutors",
      name: "find-tutors",
      component: FindTutorsView,
      meta: { title: "Find Tutors", roles: ["student"], requiresAuth: true },
    },
    {
      path: "/tutors/:id",
      name: "tutor-profile",
      component: TutorProfileView,
      meta: { title: "Tutor Profile", roles: ["student"], requiresAuth: true },
    },
    {
      path: "/create-profile",
      name: "create-profile",
      component: CreateProfileView,
      meta: { title: "Set Up Your Profile", requiresAuth: true },
    },
    {
      path: "/profile",
      name: "profile",
      component: ProfileView,
      meta: { title: "My Profile", requiresAuth: true },
    },
     {
      path: '/find-assignments',
      name: 'find-assignments',
      component: FindAssignmentsView,
      meta: { title: "Find Assignments", roles: ["tutor"], requiresAuth: true },
    },
    {
      path: "/my-matches",
      name: "my-matches",
      component: MyMatchesView,
      meta: { title: "My Matches", requiresAuth: true },
    },
    {
      path: "/account-error",
      name: "account-error",
      component: AccountLoadErrorView,
      meta: {
        title: "Account Unavailable",
        requiresAuth: true,
        skipAccountCheck: true,
      },
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: "/login",
    },
    {
      path: "/login",
      name: "login",
      component: LoginView,
      meta: { title: "Log In", guestOnly: true },
    },
    {
      path: "/forgot-password",
      name: "forgot-password",
      component: ForgotPasswordView,
      meta: { title: "Reset Password" },
    },
  ],
})

router.beforeEach(async (to) => {
  if (to.meta.guestOnly) {
    await auth.authStateReady();
    return auth.currentUser ? "/home" : true;
  }

  // Public pages do not require authentication
  if (!to.meta.requiresAuth) {
    return true;
  }

  await auth.authStateReady();

  // redirect to login from any protected page
  if (!auth.currentUser) {
    return { name: "login", query: { redirect: to.fullPath } };
  }

  // Account failures land here. Retrying another route runs the account check
  // again, while this route itself remains reachable without a redirect loop.
  if (to.meta.skipAccountCheck) {
    return true;
  }

  try {
    const account = await getCurrentAccount();
    if (!account) {
      return { name: "account-error", query: { redirect: to.fullPath } };
    }

    if (!account.onboardingComplete && to.name !== "create-profile") {
      return "/create-profile";
    }

    const allowedRoles = to.meta.roles;
    if (allowedRoles && !allowedRoles.includes(account.role)) return "/home";
  } catch (error) {
    console.error("Could not check account:", error);
    return { name: "account-error", query: { redirect: to.fullPath } };
  }
  return true;
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} | TutorLah!` : "TutorLah!";
});

export default router

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
import ComingSoonView from
  "../views/ComingSoonView.vue";
import LoginView from "../views/LoginView.vue";
import ForgotPasswordView from "../views/ForgotPasswordView.vue";

import { createRouter, createWebHistory } from 'vue-router'
import { getCurrentAccount } from "../services/session.js";
import { auth } from "../firebase.js";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0 };
  },
  routes: [
    {
      path: "/",
      redirect: "/register",
    },
    {
      path: "/register",
      name: "register",
      component: RegisterView,
    },
    {
      path: "/home",
      name: "home",
      component: HomeView,
      meta: { requiresAuth: true },
    },
    {
      path: "/post-assignment",
      name: "post-assignment",
      component: PostAssignmentView,
      meta: {
        roles: ["student"],
        requiresAuth: true
      },
    },
    {
      path: "/find-tutors",
      name: "find-tutors",
      component: FindTutorsView,
      meta: { requiresAuth: true },
    },
    {
      path: "/tutors/:id",
      name: "tutor-profile",
      component: TutorProfileView,
      meta: { requiresAuth: true },
    },
    {
      path: "/create-profile",
      name: "create-profile",
      component: CreateProfileView,
      meta: { requiresAuth: true },
    },
    {
      path: "/profile",
      name: "profile",
      component: ProfileView,
      meta: { requiresAuth: true },
    },
     {
      path: '/find-assignments',
      name: 'find-assignments',
      component: FindAssignmentsView,
      meta: { requiresAuth: true },
    },
    {
      path: "/my-matches",
      name: "my-matches",
      component: ComingSoonView,
      meta: { title: "My Matches" ,
        requiresAuth: true
      },
    },
    {
      path: "/saved",
      name: "saved",
      component: ComingSoonView,
      meta: { title: "Saved" ,
        requiresAuth: true
      },
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: "/register",
    },
    {
      path: "/login",
      name: "login",
      component: LoginView,
    },
    {
      path: "/forgot-password",
      name: "forgot-password",
      component: ForgotPasswordView,
    },
  ],
})

router.beforeEach(async (to) => {
  // Public pages do not require authentication
  if (!to.meta.requiresAuth) {
    return true;
  }

  await auth.authStateReady();

  // redirect to login from any protected page
  if (!auth.currentUser) {
    return "/login";
  }

  try {
    const account = await getCurrentAccount();
    if (!account) return true;

    if (!account.onboardingComplete && to.name !== "create-profile") {
      return "/create-profile";
    }

    const allowedRoles = to.meta.roles;
    if (allowedRoles && !allowedRoles.includes(account.role)) return "/home";
  } catch (error) {
    console.error("Could not check account:", error);
  }
  return true;
})

export default router

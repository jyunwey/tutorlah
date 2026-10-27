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
//import TutorSetupView from "../views/TutorSetupView.vue";
import TutorProfileView from
  "../views/TutorProfileView.vue";
import CreateProfileView from
  "../views/CreateProfileView.vue";

import { createRouter, createWebHistory } from 'vue-router'
import { getCurrentRole } from "../services/session.js";

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
    },
    {
    path: "/post-assignment",
    name: "post-assignment",
    component: PostAssignmentView,
    meta: { roles: ["student"] },
    },
    {
      path: "/find-tutors",
      name: "find-tutors",
      component: FindTutorsView,
    },
    {
      path: "/tutors/:id",
      name: "tutor-profile",
      component: TutorProfileView,
    },
    {
      path: "/create-profile",
      name: "create-profile",
      component: CreateProfileView,
    },
    {
      path: "/profile",
      name: "profile",
      component: ProfileView,
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: "/register",
    },
  ],
})

router.beforeEach(async (to) => {
  const allowedRoles = to.meta.roles;
  if (!allowedRoles) return true;
  try {
    const role = await getCurrentRole();
    if (role && !allowedRoles.includes(role)) return "/home";
  } catch (error) {
    console.error("Could not check role:", error);
  }
  return true;
})

export default router

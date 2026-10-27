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
//import HomeView from "../views/HomeView.vue";
import TutorProfileView from
  "../views/TutorProfileView.vue";
import FindAssignmentsView from
  "../views/FindAssignmentsView.vue";
import CreateProfileView from
  "../views/CreateProfileView.vue";
import LoginView from "../views/LoginView.vue";

import { createRouter, createWebHistory } from 'vue-router'

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
      path: '/find-assignments',
      name: 'find-assignments',
      component: FindAssignmentsView,
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
  ],
})

export default router

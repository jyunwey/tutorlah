import RegisterView from
  "../views/RegisterView.vue";
import FindTutorsView from
  "../views/FindTutorsView.vue";
import PostAssignmentView from
  "../views/PostAssignmentView.vue";
import ProfileView from
  "../views/ProfileView.vue";
//import HomeView from "../views/HomeView.vue";
//import TutorSetupView from "../views/TutorSetupView.vue";
import TutorProfileView from
  "../views/TutorProfileView.vue";
import FindAssignmentsView from
  "../views/FindAssignmentsView.vue";

import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
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
  ],
})

export default router

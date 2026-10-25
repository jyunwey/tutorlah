import RegisterView from
  "../views/RegisterView.vue";
import FindTutorsView from
  "../views/FindTutorsView.vue";
import ProfileView from
  "../views/ProfileView.vue";
import TutorProfileView from
  "../views/TutorProfileView.vue";

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
      path: "/:pathMatch(.*)*",
      redirect: "/register",
    },
    {
      path: "/profile",
      name: "profile",
      component: ProfileView,
    }
  ],
})

export default router

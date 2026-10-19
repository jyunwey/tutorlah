<template>
  <main class="auth-layout">
    <section class="auth-branding">
      <div class="auth-logo">
        🎓 TutorLah
      </div>

      <slot name="branding"></slot>
    </section>

    <section class="auth-content">
      <slot></slot>
    </section>
  </main>
</template>


<style scoped>
.auth-layout {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 70px;

  min-height: 100vh;
  width: 100%;
  padding: 50px 6%;

  background-image: url('/auth-mint-background.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  box-sizing: border-box;

  position: relative;
  overflow: hidden;
}


/* LEFT SIDE */
.auth-branding {
  flex: 1;
  max-width: 360px;
}

.auth-logo {
  font-size: 26px;
  font-weight: 800;
  margin-bottom: 32px;
}

.auth-branding :deep(h2) {
  font-size: 42px;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -1px;
  color: #10213b;
  margin: 0 0 18px;
}

.auth-branding :deep(p) {
  font-size: 15px;
  line-height: 1.5;
  color: #52658a;
}

.auth-branding :deep(.feature) {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 25px;
}

.auth-branding :deep(.feature h4) {
  font-size: 17px;
  font-weight: 700;
}

.auth-branding :deep(.feature h4),
.auth-branding :deep(.feature p) {
  margin: 0;
}

/* RIGHT SIDE */
.auth-content {
  flex: 1;
  max-width: 480px;
  padding: 35px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

</style>
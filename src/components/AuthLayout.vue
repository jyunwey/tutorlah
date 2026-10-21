<template>
  <main class="auth-layout">
    <section class="auth-branding">
      <div class="auth-logo">
        <img src="/logo-1-book.svg" alt="TutorLah logo" />
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
  gap: 120px;

  min-height: 100vh;
  width: 100%;
  padding: 48px 5%;

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
  max-width: 380px;
}

.auth-logo img {
  width: 290px;
  height: auto;
  display: block;
  margin-bottom: 20px;
}

.auth-branding :deep(h2) {
  font-size: 45px;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -1px;
  color:#0F1B4C;
  margin: 0 0 12px;
}

.auth-branding :deep(p) {
  font-size: 16px;
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
  font-size: 18px;
  font-weight: 700;
  color: #0F1B4C;
}

.auth-branding :deep(.feature h4),
.auth-branding :deep(.feature p) {
  margin: 0;
}

/* RIGHT SIDE */
.auth-content {
  flex: 1.4;
  max-width: 600px;
  padding: 35px 45px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

</style>
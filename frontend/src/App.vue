<template>
  <div class="min-h-screen bg-background">
    <NavigationBar />
    <router-view />
  </div>
</template>

<script setup>
import NavigationBar from './components/NavigationBar.vue'
</script>

<script setup>
const story = await useStoryblok('home', { version: 'draft' }, { customParent: 'http://localhost:3000'})
</script>

<template>
  <StoryblokComponent v-if="story" :blok="story.content" />
</template>

import { defineNuxtConfig } from 'nuxt'

export default defineNuxtConfig({
  modules: [['@storyblok/nuxt', { accessToken: 'IcJ7PzRn8QxfCdvckxBxmwtt' }]],
  app: {
    head: {
      script: [{ src: 'https://cdn.tailwindcss.com' }],
    },
  },
})

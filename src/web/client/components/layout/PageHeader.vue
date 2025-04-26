<template>
  <div class="d-flex justify-content-between align-items-center mb-4">
    <h2>{{ title }}</h2>
    <slot name="actions"></slot>
  </div>
</template>

<script>
export default {
  name: 'PageHeader',
  props: {
    title: {
      type: String,
      required: true
    }
  }
}
</script>

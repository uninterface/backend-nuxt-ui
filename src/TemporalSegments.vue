<script setup lang="ts">
  import {
    useTemporalSegments,
    type TemporalSegmentProps,
  } from './temporalSegments'
  const props = defineProps<TemporalSegmentProps>()
  defineExpose(useTemporalSegments(props))
</script>
<template></template>

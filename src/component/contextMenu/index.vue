<script setup lang="ts">
const emit = defineEmits(['menu-click'])
defineProps(['left','top'])
const handleMenuClick = (menuName: string) => {
    emit('menu-click', menuName)
}
</script>

<template>
  <div class="menu-container" :style="{ left, top }">
      <div class="menu-item" @click="handleMenuClick('删除笔记')">
          <img src="@/assets/delete-fill.svg">
          删除笔记
      </div>
  </div>
</template>

<style scoped>
.menu-container {
    width: 150px;
    position: absolute;
    z-index: 1000;
    background-color: #fff;
    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.2);
    padding: 10px 0;
}
.menu-item {
    display: flex;
    height: 30px;
    align-items: center;
    cursor: pointer;
    padding: 0 10px;
}
.menu-item:hover {
    background-color: #f5f5f5;
}
.menu-item > img {
    margin-right: 5px;
}
</style>
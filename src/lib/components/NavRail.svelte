<script lang="ts">
</script>

<nav class="w-[46px] bg-white border-r border-gray-200 flex flex-col items-center py-3 gap-0.5 shrink-0">

	<!-- Logo -->
	<div class="w-[30px] h-[30px] bg-[#1daa82] rounded-lg flex items-center justify-center mb-2.5">
		<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
			<rect x="1" y="1" width="5" height="5" rx="1" fill="white" />
			<rect x="8" y="1" width="5" height="5" rx="1" fill="white" />
			<rect x="1" y="8" width="5" height="5" rx="1" fill="white" />
			<rect x="8" y="8" width="5" height="5" rx="1" fill="white" />
		</svg>
	</div>

	<!-- Nav buttons -->
	<!-- Grid -->
	<button class="w-[30px] h-[30px] rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-500">
		<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
			<rect x="1" y="1" width="4.5" height="4.5" rx="1" />
			<rect x="8.5" y="1" width="4.5" height="4.5" rx="1" />
			<rect x="1" y="8.5" width="4.5" height="4.5" rx="1" />
			<rect x="8.5" y="8.5" width="4.5" height="4.5" rx="1" />
		</svg>
	</button>

	<!-- Chart -->
	<button class="w-[30px] h-[30px] rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-500">
		<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
			<polyline points="1,10 4,5 7,7 10,3 13,6" />
			<line x1="1" y1="13" x2="13" y2="13" />
		</svg>
	</button>

	<!-- Bar chart -->
	<button class="w-[30px] h-[30px] rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-500">
		<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
			<rect x="1" y="7" width="3" height="6" rx="0.5" />
			<rect x="5.5" y="4" width="3" height="9" rx="0.5" />
			<rect x="10" y="1" width="3" height="12" rx="0.5" />
		</svg>
	</button>

	<!-- Mail (ACTIVE) -->
	<button class="w-[30px] h-[30px] rounded-lg flex items-center justify-center bg-[#edf8f4] text-[#1daa82]">
		<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
			<rect x="1" y="2.5" width="12" height="9" rx="1.5" />
			<polyline points="1,3.5 7,8 13,3.5" />
		</svg>
	</button>

	<!-- Person -->
	<button class="w-[30px] h-[30px] rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-500">
		<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
			<circle cx="7" cy="4.5" r="2.5" />
			<path d="M2 13c0-2.76 2.24-5 5-5s5 2.24 5 5" />
		</svg>
	</button>

	<!-- Settings gear -->
	<button class="w-[30px] h-[30px] rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-500">
		<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
			<circle cx="7" cy="7" r="2" />
			<path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.4 2.4l1.06 1.06M10.54 10.54l1.06 1.06M2.4 11.6l1.06-1.06M10.54 3.46l1.06-1.06" />
		</svg>
	</button>

	<!-- Spacer -->
	<div class="flex-1"></div>

	<!-- Settings icon -->
	<button class="w-[30px] h-[30px] rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-500">
		<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
			<path d="M5.73 1h2.54l.36 2.15a4.97 4.97 0 011.1.64l2.07-.82 1.27 2.2-1.71 1.33a5.1 5.1 0 010 1.28l1.71 1.33-1.27 2.2-2.07-.82a4.97 4.97 0 01-1.1.64L8.27 13H5.73l-.36-2.15a4.97 4.97 0 01-1.1-.64l-2.07.82-1.27-2.2 1.71-1.33a5.1 5.1 0 010-1.28L1.93 5.17l1.27-2.2 2.07.82a4.97 4.97 0 011.1-.64L5.73 1z" />
			<circle cx="7" cy="7" r="2" />
		</svg>
	</button>

	<!-- Clock icon -->
	<button class="w-[30px] h-[30px] rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-500">
		<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
			<circle cx="7" cy="7" r="6" />
			<polyline points="7,3.5 7,7 9.5,8.5" />
		</svg>
	</button>

	<!-- Avatar circle -->
	<div class="w-[26px] h-[26px] bg-gray-200 rounded-full mt-1"></div>
</nav>

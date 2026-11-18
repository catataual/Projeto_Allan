<script lang="ts">
	import '../../styles/jogo.css';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

{@render children()}

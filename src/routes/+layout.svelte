<script>
    import "../app.css";
	let { children } = $props();
</script>

<nav>
    <button><a href="/">Home</a></button>
    <button><a href="/DTUvsTheWorld">DTUvsTheWorld</a></button>
    <button style="margin-left: auto;"><a href="/About">About</a></button>
</nav>

{@render children()}
<script>
    import "../app.css";
	let { children } = $props();
</script>

<nav>
    <a href="/"><button>Home</button></a>
    <a href="/DTUvsTheWorld"><button>DTUvsTheWorld</button></a>
    <a href="/About" style="margin-left: auto;"><button>About</button></a>
</nav>

{@render children()}
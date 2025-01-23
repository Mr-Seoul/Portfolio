<script lang="ts">
    import { fly } from "svelte/transition";
    import { onMount } from "svelte";
    //JS = Javascript, SV = Svelte, CSS = CSS, HTML = HTML
    let {stack=[]} = $props();
    let pageLoaded = $state(false);

    const colours = {
        HTML:{  to: "#EC7357",
                from: "#8F2828"},
        CSS:{   to: "#78A1BB",
                from: "#355070"},
        Javascript:{   to: "#FDD692",
                       from: "#C18A3D"},
        Svelte:{to: "#EC7357",
                from: "#8F2828"}
    }
    onMount(()=>{
        pageLoaded = true;
    });
</script>

<div>
    {#each stack as tech,index}
        {#if pageLoaded}
        <button id={tech} in:fly= {{duration: 500, opacity:0,delay: index*500}} style={`background: linear-gradient(30deg,${colours[tech].to},${colours[tech].from});`}>{tech}</button>
        {/if}
    {/each}
</div>

<style>
    button {
        opacity: 85%;
        transition: opacity 0.1s;
        --angle: 30deg;

    }
    button:hover {
        opacity: 100%;
    }
</style>
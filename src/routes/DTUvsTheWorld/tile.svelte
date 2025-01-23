<script>
	import { onMount } from "svelte";
    import {fly} from "svelte/transition";
    import {resetPiece} from "$lib/DTUvsTheWorld";

    let {
        time = 200,
        index= -1,
        delay = 0,
        piece = ""
    } = $props();

    let color = $state();
    let src = $state();
    let sideSwipe = $state({x:0,y:0});

    let x = index%8;
    let y = Math.floor(index/8)

    if ((x+y)%2==1) {
        color = "gray";
        sideSwipe = {x:100,y:25};

    } else {
        color = "darkgray";
        sideSwipe = {x:-100,y:-25};
    }

    let pageLoaded = $state(false);

    onMount(() => {
        delay = Math.floor(Math.random() * 500);
        pageLoaded = true;
        src = resetPiece(piece);
    })

    $effect(()=>{
        src = resetPiece(piece);
    })

</script>

{#if pageLoaded}
    <div id ="{index}" draggable={false} on:dragstart={e => e.preventDefault()}  in:fly= {{x:sideSwipe.x,y:sideSwipe.y, duration:750, opacity:0, delay:delay}} style="background: {color};">
        <img id={piece} src={src}>
    </div>
{/if}

<style>
    div {
        opacity: 100%;
        transition: opacity 0.2s;
    }

    div:hover {
        opacity: 85%;
    }
</style>
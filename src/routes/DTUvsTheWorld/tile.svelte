<script>
	import { onMount } from "svelte";
    import {fly} from "svelte/transition";
    import {resetPiece} from "$lib/DTUvsTheWorld";

    let {
        time = 200,
        index= -1,
        delay = 0,
        piece = "",
        highlighted = false
    } = $props();

    let color = $state();
    let src = $state();
    let sideSwipe = $state({x:0,y:0});

    let x = index%8;
    let y = Math.floor(index/8)

    function setColor() {
        if ((x+y)%2==1) {
            color = "gray";
            sideSwipe = {x:100,y:25};

        } else {
            color = "darkgray";
            sideSwipe = {x:-100,y:-25};
        }
    }
    
    setColor();

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
    <div role="region" id ="{index}" draggable={false} ondragstart={e => e.preventDefault()}  in:fly= {{x:sideSwipe.x,y:sideSwipe.y, duration:750, opacity:0, delay:delay}} style="background: {color};">
        {#if highlighted}
            <img alt="" id="highlightDot" src="assets/DTUvsTheWorld/Dot.png">
        {/if}    
        <img alt="" id={piece} src={src}>
    </div>
{/if}

<style>
    div {
        opacity: 100%;
        transition: opacity 0.2s;
        position: relative;
    }

    div:hover {
        opacity: 85%;
    }

    img {
        position: absolute;
        top: 0;
        left: 0;
    }

    #highlightDot {
        position: absolute;
        top: 0;
        left: 0;
        opacity: 50%;
        z-index: 1;
    }
</style>
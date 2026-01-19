<script>
	import { onMount } from "svelte";
    import {fly} from "svelte/transition";
    import {resetPiece} from "$lib/DTUvsTheWorld";

    let {
        time = 200,
        index= -1,
        delay = 0,
        piece = " ",
        highlighted = false,
        prevTile = {x:-1,y:-1}
    } = $props();

    let color = $state();
    let src = $state();
    let sideSwipe = $state({x:0,y:0});

    let x = index%8;
    let y = Math.floor(index/8)

    //Variables for piece animation
    let hasPiece = $state(true);

    function setColor() {
        if ((x+y)%2==0) {
            color = "#D2B48C";
            sideSwipe = {x:100,y:25};
        } else {
            color = "#987554";
            sideSwipe = {x:-100,y:-25};
        }
    }
    
    setColor();

    let pageLoaded = $state(false);

    onMount(() => {
        delay = Math.floor(Math.random() * 500);
        src = resetPiece(piece);
        pageLoaded = true;
    })

    $effect(()=>{
        src = resetPiece(piece);
        hasPiece = false;
        //Reloads tile, allowing for piece animation.
        setTimeout(() => {
            hasPiece = true;
        }, 0);
    })
    
    function animationDistance() {
        if (prevTile.x == -1 && prevTile.y == -1) {
            return {x:0,y:0}
        }
        return {x:(x-prevTile.x)*60, y:(y-prevTile.y)*60}
    }
</script>

{#if pageLoaded}
    <div role="region" id ="{index}" draggable={false} ondragstart={e => e.preventDefault()}  in:fly= {{x:sideSwipe.x,y:sideSwipe.y, duration:750, opacity:0, delay:delay}} style="background: {color};">
        <div>
            {#if highlighted}
                <img alt="" id="highlightDot" src="assets/DTUvsTheWorld/Dot.png">
            {/if} 
            {#if hasPiece} 
                <img alt="" in:fly={{x:animationDistance().x, y:animationDistance().y, duration:150, opacity:100}} id={piece} src={src}>
            {/if}
        </div>
    </div>
{/if}

<style>
    div {
        display: grid;
        width: 60px;
        height: 60px;
        opacity: 100%;
        transition: opacity 0.2s;
    }

    div:hover {
        opacity: 85%;
    }

    img {
        grid-column: 1 / -1;
        grid-row: 1 / -1;
        height: 60px;
        width: 60px;
        top: 0;
        left: 0;
        z-index: 1;
    }

    #highlightDot {
        grid-column: 1 / -1;
        grid-row: 1 / -1;
        top: 0;
        left: 0;
        opacity: 70%;
        z-index: 2;
    }
</style>
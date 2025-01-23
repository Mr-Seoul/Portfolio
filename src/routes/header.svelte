<script>
    import { createState, ScottState } from "./state.svelte.js";
    import {fly} from "svelte/transition";
    import { onMount } from "svelte";

    let { name = ""
        } = $props();
    
    const myState = createState();
    const myState2 = new ScottState;

    onMount (() => {
        name = "Users";
    });
</script>

{#if name}
    <div in:fly= {{y:-200, duration: 200, opacity:0}}>
        <h1>{name}'s form</h1>
    
        <button onclick={myState.up}>{myState.value}</button>
        <button onclick={() => myState2.up()}>{myState2.value}</button>
    </div>
{/if}
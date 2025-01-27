<script>
	import { onMount } from "svelte";
    import Board from "./board.svelte"
	import ProjectForm from "./projectForm.svelte";
    let pageLoaded = $state(false);

    onMount(() => {
        pageLoaded = true;
    });
</script>

<main>
    <h1 style="text-align: center; margin-bottom: auto;">DTU versus the world</h1><p style="text-align: center; margin-top: auto; margin-bottom: auto; color: dimgray">By Mark van Damme</p>
    {#if pageLoaded}
    <!-- 8x8 board for chess -->
        <div class="container">
            <ProjectForm></ProjectForm>
            <Board></Board>
        </div>
    {/if}

    <p style="text-align: right;"><a href="https://commons.wikimedia.org/wiki/Category:PNG_chess_pieces/Standard_transparent"> Source of Chess Pieces: Wikimedia Commons</a></p>
</main>

<style>
    .container {
        display: grid;
        padding: 10px;
        grid-template-columns: auto auto;
    }
</style>
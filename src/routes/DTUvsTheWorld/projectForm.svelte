<script>
    import TechStack from "../../Components/TechStack.svelte";
</script>


<div>
    <h1>Statement by Developer</h1>
    <h2>Vision</h2>
    <p>My goal with this project is to link a physical chessboard, which I will develop myself, to this website. Afterwards I'll place this chessboard somewhere on campus, thus allowing DTU students to play against people all over the world.</p>
    <h2>To Do</h2>
    <p>The website still needs a backend, and the physical chessboard still needs to be developed.</p>
    <h2>Credits</h2>
    <p>Special thanks to <a style="color:dimgray"href="https://petereo.com/">Pedro Diniz</a> for giving me programming advice.</p>
    <h2>Tech Stack</h2>
    <TechStack stack={["Svelte", "Javascript", "HTML", "CSS"]} ></TechStack>
    <a href="/"><button>Project Summary</button></a>
</div>

<style>
    div {
        justify-self: center;
        width: 480px;
        word-wrap: break-word;
    }

    button {
        width: 100%;
        height: 10%;
        border-radius: 15px;
        margin: 10px;
        transition: background-color 0.2s;
    }

    button:hover {
        background-color: lightgray;
    }
</style>
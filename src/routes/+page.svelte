<script>
    import Header from "./header.svelte"; 
    import {fly} from "svelte/transition";
    import { onMount } from "svelte";

    document.title = "Portfolio";

    let formState = $state({
        answers: {},
        step: 0,
        error : ''
    });

    const QUESTIONS = [
        {
            question : "What is your name?",
            id: "name",
            type: "text"
        },
        {
            question : "What is your birthday?",
            id: "birthday",
            type: "date"
        },
        {
            question: "What is your favorite colour?",
            id: "colour",
            type: "color"
        }
    ];

    function nextStep(id) {
        if (formState.answers[id]) {
                formState.step += 1;
                formState.error = '';
        } else {
            formState.error = `${id} is empty, please fill ${id} out`;
        }
    }
    //effect runs whenever any value mentioned in it updates
    onMount (() => {
        console.log("on mount");
        console.log(formState.step)
        return () => {
            console.log("on unmount");
        };
    });
</script>

<main>
    <Header name={formState.answers.name}></Header>
    
    <p>Step: {formState.step}</p>
    
    {#if formState.error}
            <p class="error">{formState.error}</p>
    {/if}
    
    <!--{@render formStep(QUESTIONS[formState.step])}-->
    {#each QUESTIONS as form, index}
        {#if formState.step === index }
            <div in:fly= {{x:200, duration: 200, opacity:0, delay:200}}
                out:fly= {{x:-200, duration: 200, opacity:0}}> 
                {@render formStep(form)}
            </div>
        {/if}
    {/each}

</main>

{#snippet formStep({ question,id,type })}
    <article>
        <div>
            <label for={id}>{question}</label>
            <input type={type} id={id} bind:value={formState.answers[id]}>
        </div>
        <button onclick={() => nextStep(id)}>Next</button>
    </article>
{/snippet}
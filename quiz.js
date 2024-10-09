let currentQuestionIndex = 0;
let currDifficulty = 'easy';
//by using the following classes we applied OPP
class Quiz{
    constructor(user, questions){
        this.user = user;
        this.score = 0;
        this.qNumber = 0;
        this.finalScore = 0;
        this.questions = questions;
    } 
    increaseScore(){
        this.score++;
    }
    nextQuestion(){
        this.qNumber++;
    }
}

class Question{
    constructor(qnID, incorrectAnswers, correctAnswer, questionText, category){
        this.qnID = qnID;
        this.incorrectAnswers = incorrectAnswers;
        this.correctAnswer = correctAnswer;
        this.questionText = questionText;
        this.category = category;
        this.allAnswers = this.shuffleAnswers();
    }
    shuffleAnswers() {
        const answers = [...this.incorrectAnswers, this.correctAnswer];
        for (let i = answers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [answers[i], answers[j]] = [answers[j], answers[i]];
        }
        return answers;
    }
    qnCorrect(userAnswer){
        return userAnswer === this.correctAnswer;
    }
}

class User{
    constructor (firstName, lastName){
        this.firstName = firstName;
        this.lastName = lastName;
    }
}
let quiz, user;
//here we used generator
function* questionGenerator(questions) {
    for (let question of questions) {
        yield question;
    }
}
//here we used asyncronus data handling
async function fetchQuestions(amount = 5, category = null, difficulty = null, type = null) {
    let url = `https://opentdb.com/api.php?amount=${amount}`;
    if (category) url += `&category=${category}`;
    if (difficulty) url += `&difficulty=${difficulty}`;
    if (type) url += `&type=${type}`;
    
    try{
        const response = await fetch(url);
        const data = await response.json();
        if (data.response_code !== 0){
            throw new Error('Unable to retrieve questions!');
        }
        return data.results.map((q, index) => new Question(
            index + 1,
            q.incorrect_answers.map(ans => decodeURIComponent(ans)), // Decode each incorrect answer
            decodeURIComponent(q.correct_answer),
            decodeURIComponent(q.question),
            decodeURIComponent(q.category)
            //q.incorrect_answers.map(ans => decodeURIComponent(ans))
        ));
    }catch(error){
        console.error(error);
        return [];
    }

}

let generator; 

document.getElementById('startQuiz').addEventListener('click', async function() {
    
    let firstName = document.getElementById('firstName').value.trim();
    let lastName = document.getElementById('lastName').value.trim();
    const errorMessage = document.getElementById('errorMessage');
    //error handling
    const nameFix = /^[a-zA-Z]+$/;
    errorMessage.style.display = 'none';
    errorMessage.innerText = '';

    if (!nameFix.test(firstName) || !nameFix.test(lastName)) {
        // alert("Please enter your first and last name!");
        errorMessage.innerText = 'Please enter a valid name (letters only, no numbers or special characters).';
        errorMessage.style.display = 'inline-block';
        return;
    }
    
    user = new User(firstName, lastName);
    const questions = await fetchQuestions(5, null, currDifficulty);

    if (questions.length === 0) {
        alert('Failed to load questions');
        return;
    }
    
    quiz = new Quiz(user, questions);
    generator = questionGenerator(quiz.questions);
    
    document.getElementById('firstPage').style.display = 'none';
    document.getElementById('quizQuestions').style.display = 'block';
    
    displayNextQuestion();
});


function decodeHTMLEntities(str){
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = str;
    return tempDiv.textContent || tempDiv.innerText || '';
}

function displayNextQuestion(){
    const next = generator.next();
    if (next.done) {
        endQuiz();
        return;
    }
    const currentQuestion = next.value;

    const questionNum = quiz.qNumber +1;
    document.getElementById("qNum").innerText = questionNum;

    const cleanQn = decodeHTMLEntities(currentQuestion.questionText);
        
    document.getElementById('questionText').innerText = cleanQn;
    document.getElementById('difficultyLevel').innerText = currDifficulty.charAt(0).toUpperCase()+ currDifficulty.slice(1);
    document.getElementById('categoryName').innerText = decodeHTMLEntities(currentQuestion.category);

    const answerChoicesDiv = document.getElementById('answerChoices');
    answerChoicesDiv.innerHTML = ''; 

    currentQuestion.allAnswers.forEach(answer => {
        const cleanAns = decodeHTMLEntities(answer)

        const button = document.createElement('button');
        button.innerText = cleanAns;
        button.classList.add('answerButton');
        //here we applied Bind
        button.addEventListener('click', checkAnswer.bind(this, currentQuestion, answer));
        answerChoicesDiv.appendChild(button);
        answerChoicesDiv.appendChild(document.createElement('br'));
    });
    document.getElementById('answerResult').style.display = 'none';
    document.getElementById('nextQn').style.display = 'none';
    quiz.nextQuestion();
}


function checkAnswer(question, userAnswer){
    
    const resultDisplay = document.getElementById('answerResult');
    resultDisplay.classList.remove('correct','wrong');
    resultDisplay.style.display = 'block'; // Make sure the result is visible
    resultDisplay.innerHTML = ''; //Clear previous

    const args = [userAnswer];
    const isCorrect = question.qnCorrect.apply(question, args); //here we used apply

    if (isCorrect){  
        quiz.increaseScore();
        currDifficulty = increaseDifficulty(currDifficulty);
        resultDisplay.classList.add('correct');
        resultDisplay.innerText = 'Correct Answer!';
    }
    else{
        currDifficulty = currDifficulty;
        resultDisplay.classList.add('wrong');
        resultDisplay.innerText = `Wrong Answer! The correct answer was: ${decodeHTMLEntities(question.correctAnswer)}`;
    }
    
    document.getElementById('currentScore').innerText= quiz.score;
    document.getElementById('nextQn').style.display = 'block';
    
    const buttons = document.querySelectorAll('.answerButton');
    buttons.forEach(btn => btn.disabled = true);
}

document.getElementById('nextQn').addEventListener('click', function() {
    document.getElementById('nextQn').style.display = 'none'; // Hide the "Next Question" button
    document.getElementById('answerResult').style.display = 'none'; // Hide the result message

    displayNextQuestion();
});

function increaseDifficulty(currDifficulty){
    if (currDifficulty == 'easy') {
            return 'medium';

        }
    if (currDifficulty == 'medium'){
            return 'hard';
        } 
        return 'hard';
};

function resetQuiz(){
    document.getElementById('scorePage').style.display = 'none';
    document.getElementById('firstPage').style.display = 'block';

    quiz.score = 0;
    quiz.qNumber = 0;

    document.getElementById('firstName').value = '';
    document.getElementById('lastName').value = '';

    const restartQuiz = document.getElementById('newQuiz');
    restartQuiz.style.display = 'none';

    const startQuizBtn = document.getElementById('startQuiz');
    startQuizBtn.style.display = 'block';

    startQuizBtn.textContent = 'Start Quiz';
};

function endQuiz() {
    const scoreMessage = `${user.firstName} ${user.lastName}, your final score is ${quiz.score} out of ${quiz.questions.length}!`;
    //here I applied call
    alert.call(window, scoreMessage);
    
    document.getElementById('quizQuestions').style.display = 'none';
    document.getElementById('scorePage').style.display = 'block';
    document.getElementById('finalScoreMsg').innerText = scoreMessage;

    const restartQuiz = document.getElementById('newQuiz');
    restartQuiz.style.display = 'block';

    restartQuiz.addEventListener('click', resetQuiz);
};


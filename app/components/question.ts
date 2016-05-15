import {Component, OnInit} from "@angular/core";
import {OnActivate, RouteSegment, Router} from '@angular/router';
import {QuestionService} from "../services/question.service";
import {AnswersService} from "../services/answers.service";
import {Question} from "../classes/question";
import {Answers} from "../classes/answers";
import {CookieService} from 'angular2-cookie/core';



@Component({
    templateUrl: "app/templates/question.html",
    providers: [QuestionService, AnswersService, CookieService]
})

export class QuestionComponent {
    constructor (
        private questionService: QuestionService,
        private answersService: AnswersService,
        private router: Router,
        private cookieService: CookieService) {}

    questionList: Question[];
    answerList: Answers[];
    errorMessage: string;
    currentQuestionId: string;
    currentQuestion: Question;
    questionText: string;

    routerOnActivate(curr: RouteSegment) {
        this.currentQuestionId = curr.getParam('id');
    }

    ngOnInit() {
        this.getQuestions();
        this.getAnswers();
    }

    getQuestions() {
        this.questionService.getQuestions()
            .subscribe(
                questions => {
                    this.questionList = questions;
                    this.currentQuestion = questions[Number(this.currentQuestionId) - 1];
                    this.questionText = this.currentQuestion.text;
                    //set cookie at the beginning of the quiz, overwriting old results if present
                    if(this.currentQuestionId == "1") {
                        this.initializeCookie();
                    }
                },
                error => this.errorMessage = error

            );
    }

    getAnswers() {
        this.answersService.getAnswers()
            .subscribe(
                answers => {
                    let fullAnswerList = answers;
                    this.answerList = this.getAnswersByQuestionId(this.currentQuestionId, fullAnswerList);
                },
                error => this.errorMessage = error
            );
    }

    getAnswersByQuestionId(id, answers) {
        let answersByQuestion = [];
        answers.forEach(function(entry) {
           if (entry.questionId == id) {
               answersByQuestion.push(entry)
           }
        });
        return answersByQuestion;
    }

    onSelect(score, axis) {
        this.calculateScore(score, axis);
        if(Number(this.currentQuestionId) <= 8) {
            this.router.navigate(['/question', Number(this.currentQuestionId) + 1]);
        } else {
            this.router.navigate(['/result']);
        }
    }

    calculateScore(score, axis) {
        let savedScore = this.cookieService.get("score");
        //set score to default if it does not exist, and calculate from there
        if (!savedScore) {
            savedScore = ("0.5,0.5,0.5");
        }
        let dividedScore = savedScore.split(",");
        //cookie values are in alphabetical order; savory, spicy, sweet
        //if an unexpected axis name appears, the score will simply remain the same
        if(axis === "savory") {
            dividedScore[0] = Number(dividedScore[0]) + score; //TODO: check boundary conditions
        } else if (axis === "spicy") {
            dividedScore[1] = Number(dividedScore[1]) + score;
        } else if (axis === "sweet") {
            dividedScore[2] = Number(dividedScore[2]) + score;
        }

        let newScore = "";
        dividedScore.forEach(function(entry) {
           newScore = newScore + entry + ',';
        });

        this.cookieService.put("score", newScore);
    }

    initializeCookie() {
        //cookie values are in alphabetical order: savory, spicy, sweet
        this.cookieService.put("score", "0.5,0.5,0.5");
    }
}
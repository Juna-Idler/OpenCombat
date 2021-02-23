'use strict';

class PlayerData
{
	constructor(max_number = 7,hand_number = 4)
	{
		const shuffle = ([...array]) => {
			for (let i = array.length - 1; i >= 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[array[i], array[j]] = [array[j], array[i]];
			}
			return array;
		}


		let deck = [];
		deck.length = max_number * 2;
		for (let i = 0;i < max_number;i++)
		{
			deck[i] = {number : i+1,red : false};
			deck[i + max_number] = {number : i+1,red : true};
		}
		this.deck = shuffle(deck);
		
		this.hand = [];
		for (let i = 0;i < hand_number;i++)
		{
			this.hand.push(this.deck.pop());
		}
		
		this.discard = [];
		this.combo = null;

		this.battle = null;
		this.draw = [];
	}
}

const STATUS = { BattlePhase:1 , DamagePhase:2 , GameEnd:3 };


class GameMaster
{
	static get STATUS() {return STATUS;}
	constructor(max_number = 7,hand_number = 4)
	{
		this.player1 = new PlayerData(max_number,hand_number);
		this.player2 = new PlayerData(max_number,hand_number);

		this.damage = 0;	// +:1の勝ち -:2の勝ち

		this.status = STATUS.BattlePhase;

		this.p1decision = -1;
        this.p2decision = -1;

		this.p1result = this._ResultData(true);
		this.p2result = this._ResultData(false);
	}

	Deside()
	{
		if (this.p1decision < 0 || this.p1decision > this.player1.hand.length) {this.p1decision = 0;}
		if (this.p2decision < 0 || this.p2decision > this.player2.hand.length) {this.p2decision = 0;}

		switch(this.status)
		{
		case STATUS.BattlePhase:
			this._BattleChoice(this.p1decision,this.p2decision);

			break;
		case STATUS.DamagePhase:
			if (this.damage > 0)
			{
				this.player2.discard.push(this.player2.hand[index]);
				this.player2.hand.splice(index,1);
				this.damage--;
			}else if (this.damage < 0)
			{
				this.player1.discard.push(this.player1.hand[index]);
				this.player1.hand.splice(index,1);
				this.damage++;
			}
			if (this.damage == 0)
			{
				this.status = STATUS.BattlePhase;
			}
			this.p1result = this._ResultData(true);
			this.p2result = this._ResultData(false);
			break;
		case STATUS.GameEnd:
			break;
		}
		
		if (this.damage > 0){
			 this.p2decision = -1;
		}
		else if (this.damage < 0) {
			 this.p1decision = -1;
		}
		else {
			this.p1decision = -1;
			this.p2decision = -1;
		}
	}

	_ResultData(p1side,gameend = 0)
	{
		let result = {
			status: this.status,
			jugde: gameend, //status==GameEnd時  +:勝ち -:負け 0:引き分け
			player : {},
			opposite : {}
		}
		let player1 = {
			hand : this.player1.hand.slice(0,this.player1.hand.length - this.player1.draw.length),
			decknum : this.player1.deck.length,
			combo : this.player1.combo,
			discard : this.player1.discard,
			battle : this.player1.battle,
			draw : this.player1.draw,
			damage : (this.damage < 0 ? -this.damage : 0)
		};
		let player2 = {
			hand : this.player2.hand.slice(0,this.player2.hand.length - this.player2.draw.length),
			decknum : this.player2.deck.length,
			combo : this.player2.combo,
			discard : this.player2.discard,
			battle : this.player2.battle,
			draw : this.player2.draw,
			damage : (this.damage > 0 ? this.damage : 0)
		}

		if (p1side)
		{
			result.player = player1;
			result.opposite = player2;
		}
		else{
			result.player = player2;
			result.opposite = player1;
		}
		return JSON.stringify(result);
	}

	_BattleChoice(index1,index2)
	{
		this.player1.battle = this.player1.hand[index1];
		this.player2.battle = this.player2.hand[index2];

		this.player1.hand.splice(index1,1);
		this.player2.hand.splice(index2,1);

		if (this.player1.combo){
			this.damage = GameMaster._Battle(this.player1.battle,this.player2.battle,this.player1.combo);
		}
		else if (this.player2.combo){
			this.damage = -GameMaster._Battle(this.player2.battle,this.player1.battle,this.player2.combo);
		}
		else{
			this.damage = GameMaster._Battle(this.player1.battle,this.player2.battle);
		}

		function Draw(player,num)
		{
			for (let i = 0; i < num && player.deck.length > 0; i++)
			{
				const card = player.deck.pop();
				player.draw.push(card);
				player.hand.push(card);
			}
		}
		
		this.player1.draw.length = 0;
		this.player2.draw.length = 0;
		Draw(this.player1,1);
		Draw(this.player2,1);
		if (this.damage > 0)
		{
			Draw(this.player2,this.damage);
		}else if (this.damage < 0){
			Draw(this.player1,-this.damage);
		}

		const p1dhand = this.player1.hand.length + (this.damage < 0 ? this.damage :0);
		const p2dhand = this.player2.hand.length - (this.damage > 0 ? this.damage :0);
		if (p1dhand <= 0 || p2dhand <= 0)
		{
			this.status = STATUS.GameEnd;
			const end_damage = p1dhand - p2dhand;
			this.p1result = this._ResultData(true,end_damage);
			this.p2result = this._ResultData(false,-end_damage);
			return;
		}	

		this.p1result = this._ResultData(true);
		this.p2result = this._ResultData(false);

		this.player1.draw.length = this.player2.draw.length = 0;
		if (this.player1.combo) {
			this.player1.discard.push(this.player1.combo);
			this.player1.combo = null;
		}
		if (this.player2.combo) {
			this.player2.discard.push(this.player2.combo);
			this.player2.combo = null;
		}
		this.status = STATUS.DamagePhase;
		if (this.damage > 0) {
			this.player1.combo = this.player1.battle;
			this.player2.discard.push(this.player2.battle);
		}
		else if (this.damage < 0) {
			this.player1.discard.push(this.player1.battle);
			this.player2.combo = this.player2.battle;
		}
		else {
			this.player1.discard.push(this.player1.battle);
			this.player2.discard.push(this.player2.battle);
	
			this.status = STATUS.BattlePhase;

		}
		this.player1.battle = this.player2.battle = null
	}	

	static _Battle(card_a,card_b,combo_a = null)	{
		let damage = 1;
		let teck = 0;
		if (combo_a){
			if (card_a.red == combo_a.red){damage = 2;}
			else {teck = 1;}
		}

		let power_a = card_a.number == 1 ? 256 : card_a.number;
		let power_b = card_b.number == 1 ? 256 : card_b.number;
		
		if (power_a == 256 && power_b == 2){return -1;}
		if (power_a == 2 && power_b == 256){return damage;}
		
		if (power_a + teck > power_b)	{return damage;}
		if (power_a + teck < power_b)	{return -1;}
		return 0;
	}

}

module.exports = GameMaster;

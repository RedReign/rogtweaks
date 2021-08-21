import { DND5E } from "../../../systems/dnd5e/module/config.js";
import ActorSheet5eCharacter from "../../../systems/dnd5e/module/actor/sheets/character.js";

let dnd5e = DND5E;
let noteIcons = CONFIG.JournalEntry.noteIcons;
noteIcons["Boon"] = "/modules/redtweaks/icons/boon.svg";
noteIcons["Shrine"] = "/modules/redtweaks/icons/shrine.svg";

Hooks.on("setup", () => {
	// Force notes to turn on
	if (game.settings.get("core", "notesDisplayToggle") !== "true") {
		game.settings.set("core", "notesDisplayToggle", true);
	}
	prepareNotes();
});

ActorSheet5eCharacter.prototype._onConvertCurrency = async function(event) {
	event.preventDefault();
	const curr = duplicate(this.actor.data.data.currency);
	const convert = {
		cp: {into: "sp", each: 100},
		sp: {into: "gp", each: 100},
		ep: {into: "gp", each: 2},
		gp: {into: "pp", each: 100}
	};
	for ( let [c, t] of Object.entries(convert) ) {
		let change = Math.floor(curr[c] / t.each);
		curr[c] -= (change * t.each);
		curr[t.into] += change;
	}
	return this.actor.update({"data.currency": curr});
}

function prepareNotes() {
	Note.prototype._drawControlIcon = function() {
		let tint = this.data.iconTint ? colorStringToHex(this.data.iconTint) : null;
		let icon = new ControlIcon({texture: this.data.icon, borderColor:getBorderColor(this), size: this.size, tint: tint});
		icon.x -= (this.size / 2);
		icon.y -= (this.size / 2);
		return icon;
	};
}

function getBorderColor(note) {
	let entry = game.journal.get(note.data.entryId);
	let permission = null;
	if (!game.user.isGM) {
		if (entry && entry.data && entry.data.content.length === 0) { return 0xFFFF00; }
		permission = entry ? entry.permission : null;
		switch (permission) {
			case 1:
				return 0xFFFF00;
			case 2:
				return 0xFF5500;
			case 3:
				return 0x00FF00;
			default:
				return 0xFFFF00;
		}
	}
	permission = entry ? entry.data.permission["default"] : null;
	switch (permission) {
		case 0:
			return 0x2288FF; break;
		case 1:
			return 0xFFFF00; break;
		case 2:
		case 3:
			return 0xFF5500; break;
		default:
			return 0xFF00FF;
	}
	return 0xFF5500;
}

Object.defineProperty(window, "showCharacterModel", {
	get: function() { return(game.system.model.Actor.character); }
});


// Changes the "school" field to "range" instead
Hooks.on("renderActorSheet5eCharacter", (app, html, data) => {
	changeSchoolToRange(app, html, data);
});

function changeSchoolToRange(app, html, data) {
	let actor = app.object;
	
	let items = html.find(".spellbook .inventory-list .item-list .item.flexrow")
	for(let i=0;i<items.length;i++) {
		let item = actor.getOwnedItem(String(items[i].getAttribute("data-item-id")));
		let data = item.data.data;
		
		let range = ((data.range) && (data.range.value || data.range.units)) ? (data.range.value || "") + (((data.range.long) && (data.range.long !== 0) && (data.rangelong != data.range.value)) ? "/" +data.range.long : "") + " " + (data.range.units ? dnd5e.distanceUnits[data.range.units] : "") : "";
		
		let rangeHtml = `<div class="spell-range">${range}</div>`;
		
		let schoolHtml = $(items[i]).find(".spell-school");
		schoolHtml.after(rangeHtml);
		schoolHtml.remove();
	}
	
	let headers = html.find(".spellbook .inventory-list .spellbook-header .spell-school");
	let headerHtml = `<div class="spell-range">Range</div>`;
	for (let i =0;i<headers.length;i++) {
		let currentHeader = $(headers[i]);
		currentHeader.after(headerHtml);
		currentHeader.remove();
	}
}


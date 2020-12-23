import commander from "commander";
import { Observable } from "rxjs";

const program = commander.program;
program
  .option("-d, --debug", "output extra debugging")
  .option("-s, --small", "small pizza size")
  .option("-p, --pizza-type <type>", "flavour of pizza")
  .option("-r, --rx, rx");

program.parse(process.argv);

if (program.debug) console.log(program.opts());
console.log("pizza details:");
if (program.small) console.log("- small pizza size");
if (program.pizzaType) console.log(`- ${program.pizzaType}`);
if (program.rx) {
  new Observable((sub) => {
    sub.next(1);
    sub.next(2);
  }).subscribe(console.log);
}

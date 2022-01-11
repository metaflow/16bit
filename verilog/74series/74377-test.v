// Copyright 2020 TimRudy https://github.com/TimRudy/ice-chips-verilog

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

// Test: Octal D flip-flop with enable

`include "./testhelpers.v"
`include "./74377.v"

module test;

localparam WIDTH = 3;

// DUT inputs
reg Enable_bar;
reg [WIDTH-1:0] D;
reg Clk;

// DUT outputs
wire [WIDTH-1:0] Q;

ttl_74377 #(.WIDTH(WIDTH), .DELAY_RISE(5), .DELAY_FALL(3)) dut(
  .Enable_bar(Enable_bar),
  .D(D),
  .Clk(Clk),
  .Q(Q)
);

initial
begin
  $dumpfile("74377-tb.vcd");
  $dumpvars;
  // the following set of tests are for: load
#65
  // initial state
  `equals(Q, 3'bxxx, "Test 1");
#0
  // load all zeroes, the clock input takes on a value
  Clk = 1'b0;
#7
  `equals(Q, 3'bxxx, "Test 1");
#0
  // load all zeroes, set up the data
  D = 3'b000;
#25
  `equals(Q, 3'bxxx, "Test 1");
#0
  // load all zeroes, steady state before the enable input takes on a value
  Clk = 1'b1;
#50
  Clk = 1'b0;
#50
  Clk = 1'b1;
#50
  `equals(Q, 3'bxxx, "Test 1");
#0
  // load all zeroes, the enable input takes on a value (disabled)
  Enable_bar = 1'b1;
#50
  `equals(Q, 3'bxxx, "Test 1");
#0
  // load all zeroes, enabled, steady state before clock edge
  Enable_bar = 1'b0;
  Clk = 1'b0;
#25
  `equals(Q, 3'bxxx, "Test 1");
#0
  // load all zeroes, not enough time for output to fall
  Clk = 1'b1;
#2
  `equals(Q, 3'bxxx, "Test 1");
#2
  // load all zeroes -> output 0s
  `equals(Q, 3'b000, "Test 1");
#140
  // hold state
  Clk = 1'b0;
#175
  `equals(Q, 3'b000, "Test 2");
#0
  // load all ones, set up the data
  D = 3'b111;
#125
  `equals(Q, 3'b000, "Test 3");
#0
  // load all ones, not enough time for output to rise
  Clk = 1'b1;
#4
  `equals(Q, 3'b000, "Test 3");
#2
  // load all ones -> output 1s
  `equals(Q, 3'b111, "Test 3");
#50
  // hold state
  Clk = 1'b0;
#125
  `equals(Q, 3'b111, "Test 4");
#0
  // load 101, set up the data
  D = 3'b101;
#15
  // load 101 -> output 101
  Clk = 1'b1;
#7
  `equals(Q, 3'b101, "Test 5");
#140
  // hold state
  Clk = 1'b0;
#50
  `equals(Q, 3'b101, "Test 6");
#0

  // the following set of tests are for: enable

  // while disabled, starting at clock 0: no load occurs
  Enable_bar = 1'b1;
  // Clk = 1'b0;
#25
  `equals(Q, 3'b101, "Test 7");
#0
  // set up different data input value 011
  D = 3'b011;
#15
  // apply clock edge with null effect on output
  Clk = 1'b1;
#50
  Clk = 1'b0;
#50
  `equals(Q, 3'b101, "Test 7");
#50
  Clk = 1'b1;
#15
  `equals(Q, 3'b101, "Test 7");
#0
  // while enabled: load data input value 011
  Enable_bar = 1'b0;
#50
  Clk = 1'b0;
#50
  `equals(Q, 3'b101, "Test 8");
#50
  // load 011 -> output 011
  Clk = 1'b1;
#15
  `equals(Q, 3'b011, "Test 8");
#75
  // while disabled, starting at clock 1: no load occurs
  Enable_bar = 1'b1;
  // Clk = 1'b1;
#25
  `equals(Q, 3'b011, "Test 9");
#0
  // set up different data input value 100
  D = 3'b100;
#25
  Clk = 1'b0;
#50
  // apply clock edge with null effect on output
  Clk = 1'b1;
#15
  `equals(Q, 3'b011, "Test 9");
#35
  Clk = 1'b0;
#50
  Clk = 1'b1;
#15
  `equals(Q, 3'b011, "Test 9");
#35
  Clk = 1'b0;
#0
  // while enabled: load data input value 100
  Enable_bar = 1'b0;
#25
  // load 100, not enough time for output to rise/fall
  Clk = 1'b1;
#2
  `equals(Q, 3'b011, "Test 10");
#5
  // load 100 -> output 100
  `equals(Q, 3'b100, "Test 10");
#75
  // hold state
  Clk = 1'b0;
#80
  `equals(Q, 3'b100, "Test 11");
#0
  // while enabled: load same value appearing at the output with null effect on output
  Clk = 1'b1;
#50
  Clk = 1'b0;
#50
  `equals(Q, 3'b100, "Test 12");
#0
  // while disabled: hold state
  Enable_bar = 1'b1;
#75
  `equals(Q, 3'b100, "Test 13");
#0
  Enable_bar = 1'b0;
#0
  $finish;
end

endmodule

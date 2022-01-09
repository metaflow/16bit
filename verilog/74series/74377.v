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

// Octal D flip-flop with enable

module ttl_74377 #(parameter WIDTH = 8, DELAY_RISE = 0, DELAY_FALL = 0)
(
  input Enable_bar,
  input [WIDTH-1:0] D,
  input Clk,
  output [WIDTH-1:0] Q
);

//------------------------------------------------//
reg [WIDTH-1:0] Q_current;

always @(posedge Clk)
begin
  if (!Enable_bar)
    Q_current <= D;
end
//------------------------------------------------//

assign #(DELAY_RISE, DELAY_FALL) Q = Q_current;

endmodule

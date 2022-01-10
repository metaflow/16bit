/*
 Copyright (c) 2022  Google LLC

 Permission is hereby granted, free of charge, to any person obtaining a copy of
 this software and associated documentation files (the "Software"), to deal in
 the Software without restriction, including without limitation the rights to
 use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 the Software, and to permit persons to whom the Software is furnished to do so,
 subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

module test;

// TODO: use assertions that $finish_and_return(1)
`TBASSERT_METHOD(tbassert)
`TBASSERT_2R_METHOD(tbassert2R)

localparam WIDTH = 3;

// DUT inputs
reg DIR;
// reg [WIDTH-1:0] D;

// DUT IO

tri [WIDTH-1:0] A;
tri [WIDTH-1:0] B;
logic [WIDTH-1:0] Vb;
logic [WIDTH-1:0] Va;

assign B=Vb;
assign A=Va;

// reg [WIDTH-1:0] A;
// reg [WIDTH-1:0] B;

// DUT
ttl_74245 #(.WIDTH(WIDTH), .DELAY_RISE(5), .DELAY_FALL(3)) dut(
  .DIR(DIR),
  .OE_bar(1'b1),
  .A(A),
  .B(B)
);

initial begin
  Va = 3'bzzz;
  Vb = 3'bzzz;
  $dumpfile("74245-tb.vcd");
  $dumpvars;
  DIR = 1;
#30
  Vb = 3'b111;
#30
  Vb = 3'b101;
#30
  $finish;
end

endmodule
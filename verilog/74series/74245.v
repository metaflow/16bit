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

module ttl_74245 #(parameter WIDTH = 8, PD_TRANS=9,
PD_DIR=16,
PD_OE=12)
(
  input DIR,
  input OE_bar,
  inout tri [WIDTH-1:0] A,
  inout tri [WIDTH-1:0] B
);

logic dir_d;
logic nOE_d;
logic [WIDTH-1:0] A_d;
logic [WIDTH-1:0] B_d;

// TODO look on output enabled.
// TODO fix width.
assign A = DIR ? B_d : {WIDTH{1'bz}};
assign B = DIR ? {WIDTH{1'bz}} : A_d;
always @* begin
  dir_d <= #(PD_DIR) DIR;
  nOE_d <= #(PD_OE) OE_bar;
  A_d <= #(PD_TRANS) A;
  B_d <= #(PD_TRANS) B;
end

endmodule
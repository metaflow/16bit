// Based on https://github.com/Johnlon/spam-1/blob/aa7fc2850c0cfb71294dc360363e222d4a120195/verilog/74245/hct74245.v
// (licensing is not clear there).
`timescale 1ns/1ns

module ttl_74245 #(parameter
PD_TRANS=9,
PD_DIR=16,
PD_OE=12)
(
  input DIR,
  input nOE,
  inout tri [7:0] A,
  inout tri [7:0] B
);
  // To simulate delays and have two-way.
  logic dir_d;
  logic nOE_d;
  logic [7:0] A_d;
  logic [7:0] B_d;

  assign A = (nOE_d | dir_d == 1) ? 8'bzzzzzzzz : B_d;
  assign B = (nOE_d | dir_d == 0) ? 8'bzzzzzzzz : A_d;
  always @* begin
      dir_d <= #(PD_DIR) DIR;
      nOE_d <= #(PD_OE) nOE;
      A_d <= #(PD_TRANS) A;
      B_d <= #(PD_TRANS) B; 
  end
endmodule
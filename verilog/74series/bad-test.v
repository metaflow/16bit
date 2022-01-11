`include "./testhelpers.v"
`include "./74245.v"
`timescale 1ns/1ns

// TODO: test what happens when we try to drive one wire with different ICs.
module test;
    logic dir=0;
    logic dir2=0;
    logic nOE=1;
    logic nOE2=1;

    logic [7:0] Vb;
    logic [7:0] Va;
    logic [7:0] Vc;
  
    tri [7:0] A;
    tri [7:0] B;
    tri [7:0] C;

    assign A=Va;
    assign B=Vb;
    assign C=Vc;
    
    localparam AB=1;
    localparam BA=0;

    ttl_74245 buf1(.A(A), .B(B), .DIR(dir), .nOE(nOE));
    ttl_74245 buf2(.A(B), .B(C), .DIR(dir2), .nOE(nOE2));
    time timer;
    initial begin
      $dumpfile("bad-tb.vcd");
      $dumpvars;

      Va=8'b10101010;
      Vb=8'bzzzzzzzz;
      Vc=8'bzzzzzzzz;
      dir = AB;
      dir2 = AB;
      `equals(A, 8'bxxxxxxxx, "OE disable");
      `equals(B , 8'bxxxxxxxx, "OE disable");
      nOE = 0;
      nOE2 = 0;
      #40
      `equals(A, 8'b10101010, "A value");
      `equals(B, 8'b10101010, "B value");
      `equals(C, 8'b10101010, "C value");
      nOE = 1;
      nOE2 = 1;
      #40
      Vc=8'b11111111;
      dir2 = BA;
      nOE2 = 0;
      #40
      nOE = 0;
      #40;
      $display("B = %d %d", B, ^B);
      // TODO convert this to always check.
      `assert(^A !== 1'bx, "A is defined");
      `assert(^B !== 1'bx, "B is defined");
      `assert(^C !== 1'bx, "C is defined");
      $finish;
    end

endmodule
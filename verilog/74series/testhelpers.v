// Based on https://github.com/Johnlon/spam-1/blob/1df4467f7b15d230492064109a8576b5753c1871/verilog/lib/assertion.v

`default_nettype none

`define FAIL $finish_and_return(1);

`define assertEquals(actual, expected_value) \
if (actual !== expected_value) \
begin  \
  $display("%9t ", $time, "FAILED Line %-4d : expected '%b'", `__LINE__, expected_value); 	\
  $display("%9t ", $time, "                 : but got  '%b'", actual); 	\
  `FAIL \
end

`define equals(ACTUAL, EXPECTED, MSG) \
if (ACTUAL !== EXPECTED) \
begin  \
  $display("Line %d: FAILED: actual ACTUAL '%b' is not expected EXPECTED '%b' - %s", `__LINE__, ACTUAL, EXPECTED, MSG); 	\
  `FAIL \
end


`define assertTrue(ACTUAL) \
if (!(ACTUAL)) begin \
  $display("%9t ", $time, " Line:%-5d FAILED: 'ACTUAL' was not True,   (d%1d)(h%2h) ", `__LINE__, (ACTUAL), (ACTUAL), (ACTUAL)); 	\
  `FAIL \
end

`define assert(ACTUAL, MSG) \
if (!(ACTUAL)) begin \
  $display("%9t ", $time, " Line:%-5d FAILED: 'ACTUAL' was not True,   (d%1d)(h%2h) %s", `__LINE__, (ACTUAL), (ACTUAL), (ACTUAL), MSG); 	\
  `FAIL \
end

`define ASSERT_TOOK(EXPR,TIMEOUT) \
begin \
  bit timed_out; \
  bit ok; \
  time st;\
  time took; \
  st=$time;\
  took=0;\
    begin \
      fork \
        begin \
          wait(EXPR); \
          ok = '1; \
          took = $time-st; \
          end \
        begin \
          #(TIMEOUT+1); \
          timed_out = '1; \
        end \
      join_none \
      wait (timed_out || ok);\
      \
      if (ok && (took < TIMEOUT)) \
      begin \
        $display("%9t", $time, " !!! TOO QUICK FOR EXPR - EXPECTED %1d - BUT TOOK %1d", (TIMEOUT), ($time-st),  "   LINE %1d",  `__LINE__);\
        $finish_and_return(1); \
      end \
      else \
      if (ok && (took == TIMEOUT)) \
      begin \
        // $display("%9t", $time, " DELAY OK- TOOK %1d  - EXPR ", ($time-st)); \
      end \
      else \
      if (timed_out == 1) \
      begin \
        `DOUBLE_CHECK(EXPR, TIMEOUT, 10, st) /* HARD LIMIT IIS A MULTIPLE */  \
        $finish_and_return(1); \
      end \
      else \
      begin \
        $display("%9t", $time, " !!! SW ERROR: DIDN'T TIME OUT 'EXPR' BUT DIDN'T SUCCEED EITHER - LINE %1d",  `__LINE__);\
        $finish_and_return(1); \
      end \
      disable fork; \
    end\
end

`define DOUBLE_CHECK(EXPR, ORIG_TIMOUT, FACTOR, st) begin \
fork \
  begin \
      #(ORIG_TIMOUT*FACTOR) \
      $display("%9t", $time, " !!! TIMED OUT - NEVER MET AFTER HARD TIME OUT %1d FOR EXPR (got %b)", ($time-st), EXPR , "   LINE %1d",  `__LINE__); \
      $finish_and_return(1); \
  end \
  begin \
    wait(EXPR); \
    if (EXPR) begin \
      $display("%9t", $time, " !!! TIMED OUT EXPECTING ORIG_TIMOUT (%1d) - BUT CONDITION MET AFTER %1d FOR EXPR (got %b)", (ORIG_TIMOUT), ($time-st), EXPR , "   LINE %1d",  `__LINE__); \
    end \
    $finish_and_return(12); \
  end \
join_none \
#(ORIG_TIMOUT*FACTOR) \
$display("%9t", $time, " !!! TIMED OUT - NEVER MET AFTER HARD TIME OUT %1d FOR EXPR (got %b)", ($time-st), EXPR , "   LINE %1d",  `__LINE__); \
$finish_and_return(1); \
end
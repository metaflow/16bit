# 2022-01-16

Tried to use random delays in propagations. It's possible to set a variable
and use it as a delay but variables cannot be passed as parameters. Also I have
found that re-running the same test over and over produces the same variable. 
That shouldn't be an issue if instead of "standard" verilog testbenches we will
use cocotb.
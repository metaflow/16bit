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

`define ASSIGN_UNPACK_ARRAY(PK_LEN, PK_WIDTH, UNPK_DEST, PK_SRC) wire [PK_LEN*PK_WIDTH-1:0] PK_IN_BUS; assign PK_IN_BUS=PK_SRC; generate genvar unpk_idx; for (unpk_idx=0; unpk_idx<PK_LEN; unpk_idx=unpk_idx+1) begin: gen_unpack assign UNPK_DEST[unpk_idx][PK_WIDTH-1:0]=PK_IN_BUS[PK_WIDTH*unpk_idx+:PK_WIDTH]; end endgenerate

`define PACK_ARRAY(PK_LEN, PK_WIDTH, UNPK_SRC) PK_OUT_BUS; wire [PK_LEN*PK_WIDTH-1:0] PK_OUT_BUS; generate genvar pk_idx; for (pk_idx=0; pk_idx<PK_LEN; pk_idx=pk_idx+1) begin: gen_pack assign PK_OUT_BUS[PK_WIDTH*pk_idx+:PK_WIDTH]=UNPK_SRC[pk_idx][PK_WIDTH-1:0]; end endgenerate

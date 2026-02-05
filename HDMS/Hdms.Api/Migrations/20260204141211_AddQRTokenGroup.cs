using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hdms.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddQRTokenGroup : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "QRTokenGroupId",
                table: "MealTokens",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "QRTokenGroups",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    QRCode = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StudentId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    TotalTokens = table.Column<int>(type: "int", nullable: false),
                    RemainingTokens = table.Column<int>(type: "int", nullable: false),
                    RedeemedTokens = table.Column<int>(type: "int", nullable: false),
                    MealDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    MealType = table.Column<int>(type: "int", nullable: false),
                    PricePerToken = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    MealPreference = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TokenOrderId = table.Column<int>(type: "int", nullable: true),
                    WeeklyMenuId = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QRTokenGroups", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QRTokenGroups_AspNetUsers_StudentId",
                        column: x => x.StudentId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_QRTokenGroups_TokenOrders_TokenOrderId",
                        column: x => x.TokenOrderId,
                        principalTable: "TokenOrders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_QRTokenGroups_WeeklyMenus_WeeklyMenuId",
                        column: x => x.WeeklyMenuId,
                        principalTable: "WeeklyMenus",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MealTokens_QRTokenGroupId",
                table: "MealTokens",
                column: "QRTokenGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_QRTokenGroups_StudentId",
                table: "QRTokenGroups",
                column: "StudentId");

            migrationBuilder.CreateIndex(
                name: "IX_QRTokenGroups_TokenOrderId",
                table: "QRTokenGroups",
                column: "TokenOrderId");

            migrationBuilder.CreateIndex(
                name: "IX_QRTokenGroups_WeeklyMenuId",
                table: "QRTokenGroups",
                column: "WeeklyMenuId");

            migrationBuilder.AddForeignKey(
                name: "FK_MealTokens_QRTokenGroups_QRTokenGroupId",
                table: "MealTokens",
                column: "QRTokenGroupId",
                principalTable: "QRTokenGroups",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MealTokens_QRTokenGroups_QRTokenGroupId",
                table: "MealTokens");

            migrationBuilder.DropTable(
                name: "QRTokenGroups");

            migrationBuilder.DropIndex(
                name: "IX_MealTokens_QRTokenGroupId",
                table: "MealTokens");

            migrationBuilder.DropColumn(
                name: "QRTokenGroupId",
                table: "MealTokens");
        }
    }
}

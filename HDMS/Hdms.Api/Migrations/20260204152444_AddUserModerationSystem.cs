using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hdms.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddUserModerationSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "UserAbuseLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ActionType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Severity = table.Column<int>(type: "int", nullable: false),
                    AbuseScore = table.Column<double>(type: "float", nullable: false),
                    DetectedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Metadata = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsReviewed = table.Column<bool>(type: "bit", nullable: false),
                    ReviewedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ReviewedById = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    ReviewNotes = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserAbuseLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserAbuseLogs_AspNetUsers_ReviewedById",
                        column: x => x.ReviewedById,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_UserAbuseLogs_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "UserSuspensions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Details = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DurationWeeks = table.Column<int>(type: "int", nullable: false),
                    SuspendedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    SuspendedUntil = table.Column<DateTime>(type: "datetime2", nullable: false),
                    SuspendedById = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsAIDetected = table.Column<bool>(type: "bit", nullable: false),
                    RevokedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RevokedById = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    RevocationReason = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserSuspensions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserSuspensions_AspNetUsers_RevokedById",
                        column: x => x.RevokedById,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_UserSuspensions_AspNetUsers_SuspendedById",
                        column: x => x.SuspendedById,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_UserSuspensions_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserAbuseLogs_ReviewedById",
                table: "UserAbuseLogs",
                column: "ReviewedById");

            migrationBuilder.CreateIndex(
                name: "IX_UserAbuseLogs_UserId",
                table: "UserAbuseLogs",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserSuspensions_RevokedById",
                table: "UserSuspensions",
                column: "RevokedById");

            migrationBuilder.CreateIndex(
                name: "IX_UserSuspensions_SuspendedById",
                table: "UserSuspensions",
                column: "SuspendedById");

            migrationBuilder.CreateIndex(
                name: "IX_UserSuspensions_UserId",
                table: "UserSuspensions",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserAbuseLogs");

            migrationBuilder.DropTable(
                name: "UserSuspensions");
        }
    }
}
